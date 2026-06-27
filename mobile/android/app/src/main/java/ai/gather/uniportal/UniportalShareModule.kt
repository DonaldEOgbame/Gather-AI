package ai.gather.uniportal

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

/**
 * Receives files shared into the app via the Android share sheet (ACTION_SEND /
 * ACTION_SEND_MULTIPLE) and hands them to JS, which routes to ShareToGather.
 *
 *   - getInitialShare(): the share that cold-started the app (read from the
 *     launching activity's intent when JS mounts).
 *   - "UniportalShareReceived" event: warm-start shares, emitted from
 *     MainActivity.onNewIntent while the app is already running.
 *
 * The shared content:// stream is copied into app cache and returned as a
 * file:// uri, since JS / DocumentPicker can't read the original SAF uri.
 */
class UniportalShareModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "UniportalShare"

  // Present so a JS NativeEventEmitter can attach without warnings.
  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  @ReactMethod
  fun getInitialShare(promise: Promise) {
    val activity = reactContext.currentActivity
    promise.resolve(activity?.let { parse(it, it.intent) })
  }

  companion object {
    const val EVENT = "UniportalShareReceived"

    /** Warm-start path: emit the shared file to JS. Called from MainActivity.onNewIntent. */
    fun emit(reactContext: ReactApplicationContext, intent: Intent?) {
      val map = parse(reactContext, intent) ?: return
      reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit(EVENT, map)
    }

    private fun parse(context: Context, intent: Intent?): WritableMap? {
      if (intent == null) return null
      if (intent.action != Intent.ACTION_SEND && intent.action != Intent.ACTION_SEND_MULTIPLE) {
        return null
      }
      val uri = firstStream(intent) ?: return null
      return copyToCache(context, uri)
    }

    private fun firstStream(intent: Intent): Uri? {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
            ?: intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)?.firstOrNull()
      } else {
        @Suppress("DEPRECATION")
        (intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            ?: intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.firstOrNull())
      }
    }

    private fun copyToCache(context: Context, uri: Uri): WritableMap? {
      return try {
        val resolver = context.contentResolver
        var name = "shared-file"
        var size = 0L
        resolver.query(uri, null, null, null, null)?.use { c ->
          val ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
          val si = c.getColumnIndex(OpenableColumns.SIZE)
          if (c.moveToFirst()) {
            if (ni >= 0 && !c.isNull(ni)) name = c.getString(ni) ?: name
            if (si >= 0 && !c.isNull(si)) size = c.getLong(si)
          }
        }
        val dir = File(context.cacheDir, "shared").apply { mkdirs() }
        val outFile = File(dir, name)
        resolver.openInputStream(uri)?.use { input ->
          outFile.outputStream().use { output -> input.copyTo(output) }
        } ?: return null

        val mime = resolver.getType(uri)
            ?: MimeTypeMap.getSingleton()
                .getMimeTypeFromExtension(name.substringAfterLast('.', "").lowercase())

        val m = Arguments.createMap()
        m.putString("uri", Uri.fromFile(outFile).toString())
        m.putString("name", name)
        m.putDouble("size", (if (size > 0) size else outFile.length()).toDouble())
        m.putString("mime", mime)
        m
      } catch (e: Exception) {
        null
      }
    }
  }
}
