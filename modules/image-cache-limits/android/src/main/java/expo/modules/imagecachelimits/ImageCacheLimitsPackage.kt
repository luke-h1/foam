package expo.modules.imagecachelimits

import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

/**
 * Auto-discovered by Expo autolinking (no entry needed in
 * expo-module.config.json). Registers the launch-time cache bound - the
 * Android analog of the iOS ImageCacheLimitsAppDelegateSubscriber.
 */
class ImageCacheLimitsPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> =
    listOf(ImageCacheLimitsApplicationLifecycle())
}
