import ExpoModulesCore

public class UIKitWebViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("UIKitWebView")

    View(UIKitWebView.self) {
      Events(
        "onContentProcessDidTerminate",
        "onError",
        "onLoadEnd",
        "onLoadStart",
        "onMessage",
        "onNavigationStateChange"
      )

      Prop("allowsFullscreenVideo") { (view: UIKitWebView, allowsFullscreenVideo: Bool) in
        view.allowsFullscreenVideo = allowsFullscreenVideo
      }

      Prop("debugRawTwitchPlayerBridge") { (view: UIKitWebView, debugRawTwitchPlayerBridge: Bool) in
        view.debugRawTwitchPlayerBridge = debugRawTwitchPlayerBridge
      }

      Prop("injectedJavaScript") { (view: UIKitWebView, injectedJavaScript: String?) in
        view.injectedJavaScript = injectedJavaScript
      }

      Prop("javaScriptCommand") { (view: UIKitWebView, javaScriptCommand: String?) in
        view.javaScriptCommand = javaScriptCommand
      }

      Prop("keyboardDisplayRequiresUserAction") { (_: UIKitWebView, _: Bool) in
      }

      Prop("parent") { (view: UIKitWebView, parent: String?) in
        view.parent = parent ?? "www.twitch.tv"
      }

      Prop("playerWebsiteUrl") { (view: UIKitWebView, playerWebsiteUrl: String?) in
        view.playerWebsiteUrl = playerWebsiteUrl
      }

      Prop("rawTwitchPlayerAutoplay") { (view: UIKitWebView, rawTwitchPlayerAutoplay: Bool) in
        view.rawTwitchPlayerAutoplay = rawTwitchPlayerAutoplay
      }

      Prop("rawTwitchPlayerBridgeEnabled") { (view: UIKitWebView, rawTwitchPlayerBridgeEnabled: Bool) in
        view.rawTwitchPlayerBridgeEnabled = rawTwitchPlayerBridgeEnabled
      }

      Prop("restrictNavigationToTwitchPlayer") { (view: UIKitWebView, restrictNavigationToTwitchPlayer: Bool) in
        view.restrictNavigationToTwitchPlayer = restrictNavigationToTwitchPlayer
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
