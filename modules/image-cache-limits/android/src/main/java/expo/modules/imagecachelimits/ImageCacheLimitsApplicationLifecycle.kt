package expo.modules.imagecachelimits

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import com.bumptech.glide.Glide
import com.bumptech.glide.MemoryCategory
import expo.modules.core.interfaces.ApplicationLifecycleListener

class ImageCacheLimitsApplicationLifecycle : ApplicationLifecycleListener {
  override fun onCreate(application: Application?) {
    val app = application ?: return

    val activityManager =
      app.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val category = memoryCategoryFor(activityManager)

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
    const val HIGH_HEAP_MB = 256
  }
}
