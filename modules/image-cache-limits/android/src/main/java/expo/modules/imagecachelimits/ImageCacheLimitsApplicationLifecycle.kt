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
 * Sizes Glide's decoded-image memory cache and bitmap pool at launch - the
 * loader expo-image renders through. Glide's cache is already bounded by its
 * default MemorySizeCalculator; this scales that bound to the device's heap so
 * busy emote-heavy chats re-decode and churn the GC less on capable hardware
 * while staying tight on constrained devices.
 *
 * setMemoryCategory scales the existing memory cache and bitmap pool (LOW = 0.5x,
 * NORMAL = 1x, HIGH = 1.5x). The wider pool on high-heap devices means fast chat
 * scroll reuses bitmaps instead of reallocating them; pressure is still released
 * because Glide registers its own ComponentCallbacks2 and trims on system
 * signals. This never touches the AppGlideModule, so expo-image's AVIF/animated/
 * okhttp integrations are untouched.
 */
class ImageCacheLimitsApplicationLifecycle : ApplicationLifecycleListener {
  override fun onCreate(application: Application?) {
    val app = application ?: return

    val activityManager =
      app.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val category = memoryCategoryFor(activityManager)

    /*
     * setMemoryCategory must run on the main thread (Glide asserts it) and forces
     * eager Glide initialisation, so posting it off the Application.onCreate
     * critical path keeps first-frame startup unblocked while still applying
     * before any image loads.
     */
    Handler(Looper.getMainLooper()).post {
      Glide.get(app).setMemoryCategory(category)
    }
  }

  /**
   * LOW for low-RAM devices, HIGH for large-heap flagships (>= 256MB large heap
   * class), NORMAL otherwise. largeMemoryClass tracks the heap the app gets with
   * android:largeHeap and is the closest proxy to how much decoded imagery the
   * device can hold without thrashing.
   */
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
     * Large-heap memory class (MB) at or above which a device is treated as a
     * flagship for cache sizing. 256MB+ large heaps are typical of recent
     * high-end phones; mid-range devices sit below this.
     */
    const val HIGH_HEAP_MB = 256
  }
}
