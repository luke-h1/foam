package expo.modules.imagememorypressure

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition


class ImageMemoryPressureModule : Module() {

  private val trimCallback = object : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int) {
      if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) {
        sendEvent("onMemoryPressure", mapOf("level" to level))
      }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {}

    @Deprecated("Deprecated in API 34")
    override fun onLowMemory() {
      sendEvent(
        "onMemoryPressure",
        mapOf("level" to ComponentCallbacks2.TRIM_MEMORY_COMPLETE)
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

  private fun availableMemoryBytes(): Double {
    val context = appContext.reactContext ?: return 0.0
    val activityManager =
      context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        ?: return 0.0

    val memoryInfo = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(memoryInfo)

    val headroom = memoryInfo.availMem - memoryInfo.threshold
    return if (headroom > 0L) headroom.toDouble() else 0.0
  }
}
