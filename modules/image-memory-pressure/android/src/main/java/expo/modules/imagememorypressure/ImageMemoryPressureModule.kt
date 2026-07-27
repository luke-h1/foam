package expo.modules.imagememorypressure

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ImageMemoryPressureModule : Module() {

  /**
   * `registerComponentCallbacks` lands on the Application; unregister on the same
   * reference, since `appContext.reactContext` can already be null in `OnDestroy`.
   */
  private var registeredContext: Context? = null

  private val trimCallback = object : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int) {
      // Android 14+ only delivers UI_HIDDEN/BACKGROUND/COMPLETE; the RUNNING_*
      // band still arrives on 13 and below. Forward all, JS picks the strength.
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
   * System headroom above the low-memory-killer threshold. Bitmap pixels and the
   * Hermes heap are native allocations, so Java-heap headroom never reflects image
   * pressure. Returns `1` when at/past the threshold (`0` means unavailable).
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
