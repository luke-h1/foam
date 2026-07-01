import ExpoModulesCore
import SDWebImage

/**
 * Bounds the SDWebImage (`SDImageCache.shared`) decoded-image memory cache that
 * expo-image renders through. By default the cache is unbounded and only evicts
 * on memory-warning, so decoded animated emote frames accumulated hundreds of MB
 * in busy chats (issue #594) and eventually jettisoned the app (std::bad_alloc /
 * WatchdogTermination in channels like caedrel).
 *
 * `maxMemoryCost` is in BYTES ("the bytes size held in memory"). This runs at
 * launch as an early pre-JS floor; `index.js` reconfigures the same cache to a
 * RAM-proportional value once the bundle loads. Scale to ~2% of physical RAM,
 * clamped to [96MB, 384MB], so a smaller device caps tighter here too.
 * Android needs no equivalent — Coil's memory cache is bounded by default.
 */
public class ImageCacheLimitsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let physicalMemory = ProcessInfo.processInfo.physicalMemory
    let minCost: UInt = 96 * 1024 * 1024
    let maxCost: UInt = 384 * 1024 * 1024
    let scaled = UInt(Double(physicalMemory) * 0.02)
    SDImageCache.shared.config.maxMemoryCost = max(minCost, min(maxCost, scaled))
    return true
  }
}
