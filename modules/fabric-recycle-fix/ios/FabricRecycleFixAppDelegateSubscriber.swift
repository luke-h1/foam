import ExpoModulesCore
import ObjectiveC

/**
 * React Native 0.86 `RCTViewComponentView.prepareForRecycle` resets its layout
 * metrics to a value that is not `EmptyLayoutMetrics`, so the next
 * `updateLayoutMetrics` skips `hidden` and a pooled `display: none` view is
 * reused still hidden. In chat that is a blank row, badge or emote slot.
 * Upstream fix: facebook/react-native#57590. React core ships prebuilt here, so
 * this resets `hidden` at runtime instead. Remove once the app is on a React
 * Native release that contains #57590.
 */
public class FabricRecycleFixAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _: UIApplication,
    didFinishLaunchingWithOptions _: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let selector = NSSelectorFromString("prepareForRecycle")
    guard
      let viewClass = NSClassFromString("RCTViewComponentView"),
      let method = class_getInstanceMethod(viewClass, selector)
    else {
      return true
    }
    let inherited = class_getSuperclass(viewClass).flatMap { class_getInstanceMethod($0, selector) }
    guard method != inherited else {
      return true
    }
    typealias PrepareForRecycle = @convention(c) (AnyObject, Selector) -> Void
    let original = unsafeBitCast(method_getImplementation(method), to: PrepareForRecycle.self)
    let replacement: @convention(block) (AnyObject) -> Void = { view in
      original(view, selector)
      (view as? UIView)?.isHidden = false
    }
    method_setImplementation(method, imp_implementationWithBlock(replacement))
    return true
  }
}
