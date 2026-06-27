package ai.gather.uniportal

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import java.io.File

/**
 * Native bridge for the enterprise recursive file scan (Module 3 + Reality Check).
 * Backs the JS `NativeFilesModule` contract in src/scan/fileSource.ts:
 *   - hasAllFilesAccess(): Boolean
 *   - requestAllFilesAccess(): Boolean   (opens the system all-files-access grant)
 *   - listRecursive(roots): [{uri,name,size,mime}]
 *
 * Only meaningful on the sideloaded/MDM target that holds MANAGE_EXTERNAL_STORAGE;
 * on a device without the grant the JS layer degrades to document-picker import.
 */
class UniportalFilesModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

  // Held while the user is on the system grant screen; resolved on return (onHostResume).
  private var pendingGrant: Promise? = null

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = "UniportalFiles"

  private fun hasAccess(): Boolean =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Environment.isExternalStorageManager()
      } else {
        // Pre-Android 11: legacy WRITE_EXTERNAL_STORAGE grant covers broad access.
        true
      }

  @ReactMethod
  fun hasAllFilesAccess(promise: Promise) {
    promise.resolve(hasAccess())
  }

  @ReactMethod
  fun requestAllFilesAccess(promise: Promise) {
    if (hasAccess()) {
      promise.resolve(true)
      return
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      // No all-files concept pre-R, and we can't request it here.
      promise.resolve(false)
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("no_activity", "No foreground activity to launch the grant screen")
      return
    }
    pendingGrant = promise
    try {
      val intent = Intent(
          Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
          Uri.parse("package:" + reactContext.packageName),
      )
      activity.startActivity(intent)
    } catch (e: Exception) {
      // Some OEMs don't honor the per-app intent; fall back to the global list.
      try {
        activity.startActivity(Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION))
      } catch (e2: Exception) {
        pendingGrant = null
        promise.reject("intent_failed", "Could not open all-files-access settings", e2)
      }
    }
  }

  /** Resolve a pending grant request once the user returns from the settings screen. */
  override fun onHostResume() {
    pendingGrant?.let { p ->
      pendingGrant = null
      p.resolve(hasAccess())
    }
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {
    pendingGrant = null
  }

  @ReactMethod
  fun listRecursive(roots: ReadableArray, promise: Promise) {
    if (!hasAccess()) {
      promise.reject("no_access", "All-files access has not been granted")
      return
    }
    try {
      val base = Environment.getExternalStorageDirectory()
      val out = Arguments.createArray()
      for (i in 0 until roots.size()) {
        val rel = roots.getString(i) ?: continue
        val dir = File(base, rel)
        if (dir.exists() && dir.isDirectory) {
          walk(dir, out)
        }
      }
      promise.resolve(out)
    } catch (e: Exception) {
      promise.reject("scan_failed", "Recursive scan failed", e)
    }
  }

  private fun walk(dir: File, out: WritableArray) {
    val children = dir.listFiles() ?: return
    for (f in children) {
      when {
        f.isDirectory -> walk(f, out)
        f.isFile -> {
          val m = Arguments.createMap()
          m.putString("uri", Uri.fromFile(f).toString())
          m.putString("name", f.name)
          m.putDouble("size", f.length().toDouble())
          m.putString("mime", mimeOf(f.name))
          out.pushMap(m)
        }
      }
    }
  }

  private fun mimeOf(name: String): String? {
    val ext = name.substringAfterLast('.', "").lowercase()
    if (ext.isEmpty()) return null
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext)
  }
}
