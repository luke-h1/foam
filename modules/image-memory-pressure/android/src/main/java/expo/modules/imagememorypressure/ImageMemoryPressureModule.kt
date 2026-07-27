package expo.modules.imagememorypressure

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ImageMemoryPressureModule : Module() {

  private val trimCallback = object : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int) {
      if (
        level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW &&
        level < ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN
      ) {
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
      appContext.reactContext?.registerComponentCallbacks(trimCallback)
    }

    OnDestroy {
      appContext.reactContext?.unregisterComponentCallbacks(trimCallback)
    }
  }

  /**
   * Process-local Java-heap headroom. Not a perfect analog of iOS
   * `os_proc_available_memory()` (native bitmaps sit outside the Java heap),
   * but unlike system-wide `availMem` it will not trip under unrelated device
   * pressure. Native/bitmap spikes are still handled via `onTrimMemory`.
   * Returns `1` when exhausted so the JS poll treats it as low (`0` means
   * unavailable / monitoring disabled).
   */
  private fun availableMemoryBytes(): Double {
    val runtime = Runtime.getRuntime()
    val used = runtime.totalMemory() - runtime.freeMemory()
    val headroom = runtime.maxMemory() - used
    return if (headroom > 0L) headroom.toDouble() else 1.0
  }
}
