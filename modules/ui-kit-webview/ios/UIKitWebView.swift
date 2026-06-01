import ExpoModulesCore
import UIKit
import WebKit

final class UIKitWebView: ExpoView, WKNavigationDelegate, WKUIDelegate {
  let onError = EventDispatcher()
  let onLoadEnd = EventDispatcher()
  let onLoadStart = EventDispatcher()
  let onNavigationStateChange = EventDispatcher()

  private let webView: WKWebView
  private var pendingURL: URL?

  var allowsFullscreenVideo = false

  var scrollEnabled = false {
    didSet {
      webView.scrollView.isScrollEnabled = scrollEnabled
      webView.scrollView.bounces = scrollEnabled
    }
  }

  var url: String? {
    didSet {
      guard url != oldValue else {
        return
      }

      pendingURL = url.flatMap(URL.init(string:))
      loadIfNeeded()
    }
  }

  required init(appContext: AppContext? = nil) {
    let configuration = WKWebViewConfiguration()
    configuration.allowsInlineMediaPlayback = true
    configuration.mediaTypesRequiringUserActionForPlayback = []
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

    webView = WKWebView(frame: .zero, configuration: configuration)

    super.init(appContext: appContext)

    webView.backgroundColor = .black
    webView.isOpaque = false
    webView.navigationDelegate = self
    webView.scrollView.bounces = false
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.scrollView.isScrollEnabled = false
    webView.translatesAutoresizingMaskIntoConstraints = false
    webView.uiDelegate = self

    addSubview(webView)

    NSLayoutConstraint.activate([
      webView.topAnchor.constraint(equalTo: topAnchor),
      webView.bottomAnchor.constraint(equalTo: bottomAnchor),
      webView.leadingAnchor.constraint(equalTo: leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: trailingAnchor)
    ])
  }

  func loadIfNeeded() {
    guard let pendingURL,
      webView.url != pendingURL else {
      return
    }

    var request = URLRequest(url: pendingURL)
    if let host = pendingURL.host {
      request.setValue("https://\(host)/", forHTTPHeaderField: "Origin")
      request.setValue("https://\(host)/", forHTTPHeaderField: "Referer")
    }
    webView.load(request)
  }

  func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation?) {
    sendNavigationEvent(onLoadStart)
  }

  func webView(_ webView: WKWebView, didCommit navigation: WKNavigation?) {
    sendNavigationEvent(onNavigationStateChange)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
    sendNavigationEvent(onNavigationStateChange)
    sendNavigationEvent(onLoadEnd)
  }

  func webView(
    _ webView: WKWebView,
    didFail navigation: WKNavigation?,
    withError error: Error
  ) {
    sendErrorEvent(error)
    sendNavigationEvent(onLoadEnd)
  }

  func webView(
    _ webView: WKWebView,
    didFailProvisionalNavigation navigation: WKNavigation?,
    withError error: Error
  ) {
    sendErrorEvent(error)
    sendNavigationEvent(onLoadEnd)
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.cancel)
      return
    }

    if url.scheme == "foam" {
      decisionHandler(.cancel)
      return
    }

    decisionHandler(.allow)
  }

  func webView(
    _ webView: WKWebView,
    createWebViewWith configuration: WKWebViewConfiguration,
    for navigationAction: WKNavigationAction,
    windowFeatures: WKWindowFeatures
  ) -> WKWebView? {
    if navigationAction.targetFrame == nil {
      webView.load(navigationAction.request)
    }

    return nil
  }

  private func sendNavigationEvent(_ dispatcher: EventDispatcher) {
    dispatcher([
      "canGoBack": webView.canGoBack,
      "canGoForward": webView.canGoForward,
      "loading": webView.isLoading,
      "title": webView.title as Any,
      "url": webView.url?.absoluteString ?? ""
    ])
  }

  private func sendErrorEvent(_ error: Error) {
    let nsError = error as NSError
    onError([
      "code": nsError.code,
      "description": nsError.localizedDescription,
      "domain": nsError.domain,
      "url": webView.url?.absoluteString ?? ""
    ])
  }

}
