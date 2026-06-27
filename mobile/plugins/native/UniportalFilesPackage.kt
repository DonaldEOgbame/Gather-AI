package ai.gather.uniportal

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Registers the UniportalFiles scanner and UniportalShare receive-intent modules. */
class UniportalFilesPackage : ReactPackage {
  override fun createNativeModules(
      reactContext: ReactApplicationContext,
  ): List<NativeModule> =
      listOf(
          UniportalFilesModule(reactContext),
          UniportalShareModule(reactContext),
      )

  override fun createViewManagers(
      reactContext: ReactApplicationContext,
  ): List<ViewManager<*, *>> = emptyList()
}
