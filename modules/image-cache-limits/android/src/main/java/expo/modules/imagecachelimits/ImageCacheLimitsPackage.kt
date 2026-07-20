package expo.modules.imagecachelimits

import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

/**
 * Auto-discovered by Expo autolinking; no expo-module.config.json entry needed.
 */
class ImageCacheLimitsPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> =
    listOf(ImageCacheLimitsApplicationLifecycle())
}
