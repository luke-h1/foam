package expo.modules.imagecachelimits

import android.app.ActivityManager
import android.app.Application
import android.content.Context
import com.bumptech.glide.Glide
import com.bumptech.glide.MemoryCategory
import expo.modules.core.interfaces.ApplicationLifecycleListener

/**
 * Bounds Glide's decoded-image memory cache at launch - the loader expo-image
 * renders through. Unlike the iOS SDWebImage cache this addresses (which was
 * unbounded), Glide's cache is already bounded by its default MemorySizeCalculator;
 * this only tightens it on constrained devices.
 *
 * setMemoryCategory scales the existing memory cache and bitmap pool (LOW = 0.5x,
 * NORMAL = 1x, HIGH = 1.5x). We drop low-RAM devices to LOW so busy chats trim
 * sooner, and leave everything else at Glide's default. This never touches the
 * AppGlideModule, so expo-image's AVIF/animated/okhttp integrations are untouched.
 */
class ImageCacheLimitsApplicationLifecycle : ApplicationLifecycleListener {
  override fun onCreate(application: Application?) {
    val app = application ?: return

    val activityManager =
      app.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val category =
      if (activityManager?.isLowRamDevice == true) {
        MemoryCategory.LOW
      } else {
        MemoryCategory.NORMAL
      }

    Glide.get(app).setMemoryCategory(category)
  }
}
