package expo.modules.imagememorypressure

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ImageMemoryPressureModule : Module() {

  /**
   * The context the callback was registered on. `Context.registerComponentCallbacks`
   * lands on the Application, so if `appContext.reactContext` is already gone when
   * `OnDestroy` runs (JS reload), unregistering through it again would silently skip
   * and leak the callback into a destroyed module. Unregister on the same reference.
   */
  private var registeredContext: Context? = null

  private val trimCallback = object : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int) {
      // Android 14+ only delivers TRIM_MEMORY_UI_HIDDEN / TRIM_MEMORY_BACKGROUND /
      // TRIM_MEMORY_COMPLETE; the RUNNING_* levels still arrive on Android 13 and
      // below. Forward everything from RUNNING_LOW up and let JS pick the trim
      // strength from the level.
      if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) {
        sendEvent("onMemoryPressure", mapOf("level" to level))
      }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {}

    @Suppress("DEPRECATION")
    override fun onLowMemory() {
      sendEvent(
        "onMemoryPressure",
        mapOf("level" to ComponentCallbacks2.TRIM_MEMORY_COMPLETE),
      )
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ImageMemoryPressure")

    Events("onMemoryPressure")

    Function("getAvailableMemory") {
      availableMemoryBytes()
    }

    OnCreate {
      appContext.reactContext?.applicationContext?.also {
        registeredContext = it
        it.registerComponentCallbacks(trimCallback)
      }
    }

    OnDestroy {
      registeredContext?.unregisterComponentCallbacks(trimCallback)
      registeredContext = null
    }
  }

  /**
   * System-wide headroom above the low-memory-killer threshold
   * (`availMem - threshold`). Bitmap pixels and the Hermes heap are native
   * allocations, so Java-heap headroom never reflects image pressure; distance
   * to the LMK threshold is the closest Android analog of iOS
   * `os_proc_available_memory()`. Returns `1` when at/past the threshold so the
   * JS poll treats it as low (`0` means unavailable / monitoring disabled).
   */
  private fun availableMemoryBytes(): Double {
    val activityManager =
      appContext.reactContext?.getSystemService(Context.ACTIVITY_SERVICE)
        as? ActivityManager ?: return 0.0
    val memoryInfo = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(memoryInfo)
    val headroom = memoryInfo.availMem - memoryInfo.threshold
    return if (headroom > 0L) headroom.toDouble() else 1.0
  }
}
