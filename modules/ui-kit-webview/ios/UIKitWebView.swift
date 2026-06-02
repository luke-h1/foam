import ExpoModulesCore
import UIKit
import WebKit

final class UIKitWebView: ExpoView, WKNavigationDelegate, WKUIDelegate {
  let onError = EventDispatcher()
  let onContentProcessDidTerminate = EventDispatcher()
  let onLoadEnd = EventDispatcher()
  let onLoadStart = EventDispatcher()
  let onNavigationStateChange = EventDispatcher()

  private let webView: WKWebView
  private var pendingURL: URL?
  private weak var configuredInteractivePopGestureRecognizer: UIGestureRecognizer?
  private let allowedNavigationPrefixes = [
    "about:blank",
    "https://id.twitch.tv/",
    "https://www.twitch.tv/passport-callback",
    "https://clips.twitch.tv/",
    "https://player.twitch.tv/"
  ]

  var allowsFullscreenVideo = false
  var parent = "www.twitch.tv"
  var playerWebsiteUrl: String?
  var restrictNavigationToTwitchPlayer = false

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
    webView.isOpaque = true
    webView.allowsLinkPreview = false
    webView.navigationDelegate = self
    webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
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

  override func layoutSubviews() {
    super.layoutSubviews()
    normalizeScrollInsets()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    configureInteractivePopGesturePriority()
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

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
    normalizeScrollInsets()
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

  func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
    onContentProcessDidTerminate([
      "url": webView.url?.absoluteString ?? ""
    ])
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

    if restrictNavigationToTwitchPlayer,
      navigationAction.targetFrame?.isMainFrame != false,
      !isAllowedTwitchNavigation(url.absoluteString) {
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

  private func isAllowedTwitchNavigation(_ url: String) -> Bool {
    if allowedNavigationPrefixes.contains(where: { url.hasPrefix($0) }) {
      return true
    }

    if let parentBaseUrl = baseUrlForParent(parent),
      url.hasPrefix(parentBaseUrl) {
      return true
    }

    if let playerWebsiteBaseUrl = baseUrl(playerWebsiteUrl),
      url.hasPrefix(playerWebsiteBaseUrl) {
      return true
    }

    return false
  }

  private func baseUrlForParent(_ parent: String) -> String? {
    let trimmedParent = parent.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !trimmedParent.isEmpty else {
      return nil
    }

    return "https://\(trimmedParent)/"
  }

  private func baseUrl(_ url: String?) -> String? {
    guard let url,
      let parsedURL = URL(string: url),
      let scheme = parsedURL.scheme,
      let host = parsedURL.host else {
      return nil
    }

    if let port = parsedURL.port {
      return "\(scheme)://\(host):\(port)/"
    }

    return "\(scheme)://\(host)/"
  }

  private func normalizeScrollInsets() {
    webView.scrollView.contentInset = .zero

    let adjustedContentInset = webView.scrollView.adjustedContentInset
    if adjustedContentInset != .zero {
      webView.scrollView.contentInset = UIEdgeInsets(
        top: -adjustedContentInset.top,
        left: -adjustedContentInset.left,
        bottom: -adjustedContentInset.bottom,
        right: -adjustedContentInset.right
      )
    }
  }

  private func configureInteractivePopGesturePriority() {
    guard let interactivePopGestureRecognizer = nearestViewController()?
      .navigationController?
      .interactivePopGestureRecognizer,
      interactivePopGestureRecognizer !== configuredInteractivePopGestureRecognizer else {
      return
    }

    webView.scrollView.panGestureRecognizer.require(toFail: interactivePopGestureRecognizer)
    configuredInteractivePopGestureRecognizer = interactivePopGestureRecognizer
  }

  private func nearestViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let currentResponder = responder {
      if let viewController = currentResponder as? UIViewController {
        return viewController
      }

      responder = currentResponder.next
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
