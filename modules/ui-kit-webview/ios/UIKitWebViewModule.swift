import ExpoModulesCore

public class UIKitWebViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("UIKitWebView")

    View(UIKitWebView.self) {
      Events(
        "onError",
        "onLoadEnd",
        "onLoadStart",
        "onNavigationStateChange"
      )

      Prop("allowsFullscreenVideo") { (view: UIKitWebView, allowsFullscreenVideo: Bool) in
        view.allowsFullscreenVideo = allowsFullscreenVideo
      }

      Prop("keyboardDisplayRequiresUserAction") { (_: UIKitWebView, _: Bool) in
      }

      Prop("scrollEnabled") { (view: UIKitWebView, isScrollEnabled: Bool) in
        view.scrollEnabled = isScrollEnabled
      }

      Prop("url") { (view: UIKitWebView, url: String?) in
        view.url = url
      }

      OnViewDidUpdateProps { view in
        view.loadIfNeeded()
      }
    }
  }
}
