package expo.modules.imagecachelimits

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import com.bumptech.glide.Glide
import com.bumptech.glide.MemoryCategory
import expo.modules.core.interfaces.ApplicationLifecycleListener

/**
 * Scales Glide's default memory-cache/bitmap-pool bound to the device tier at
 * launch (setMemoryCategory LOW = 0.5x, NORMAL = 1x, HIGH = 1.5x). Glide still
 * trims on system signals and the AppGlideModule is untouched.
 */
class ImageCacheLimitsApplicationLifecycle : ApplicationLifecycleListener {
  override fun onCreate(application: Application?) {
    val app = application ?: return

    val activityManager =
      app.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val category = memoryCategoryFor(activityManager)

    /*
     * setMemoryCategory must run on the main thread (Glide asserts it) and
     * forces eager Glide init, so post it off the Application.onCreate path.
     */
    Handler(Looper.getMainLooper()).post {
      Glide.get(app).setMemoryCategory(category)
    }
  }

  private fun memoryCategoryFor(activityManager: ActivityManager?): MemoryCategory {
    if (activityManager == null) {
      return MemoryCategory.NORMAL
    }

    if (activityManager.isLowRamDevice) {
      return MemoryCategory.LOW
    }

    return if (activityManager.largeMemoryClass >= HIGH_HEAP_MB) {
      MemoryCategory.HIGH
    } else {
      MemoryCategory.NORMAL
    }
  }

  private companion object {
    /**
     * Large-heap memory class (MB) at or above which a device gets HIGH.
     */
    const val HIGH_HEAP_MB = 256
  }
}
