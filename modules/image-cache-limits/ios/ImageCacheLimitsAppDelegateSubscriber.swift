import ExpoModulesCore
import SDWebImage

/**
 * Bounds the SDWebImage decoded-image memory cache used by
 * react-native-nitro-image. By default the cache is unbounded and only
 * evicts on memory-warning, so decoded animated emote frames accumulated
 * hundreds of MB in busy chats (issue #594). `maxMemoryCost` is measured
 * in pixels: 32M pixels of RGBA is roughly 128MB of decoded frames.
 * Android needs no equivalent — Coil's memory cache is bounded by default.
 */
public class ImageCacheLimitsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    SDImageCache.shared.config.maxMemoryCost = 32 * 1024 * 1024
    return true
  }
}
