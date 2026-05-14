//
//  ChangelogView.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import ExpoModulesCore
import WebKit

final class ChangelogView: ExpoView, WKNavigationDelegate {
  let onLoad = EventDispatcher()

  private let webView = WKWebView(frame: .zero)
  private var pendingURL: URL?

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
    super.init(appContext: appContext)

    webView.navigationDelegate = self
    webView.translatesAutoresizingMaskIntoConstraints = false
    addSubview(webView)

    NSLayoutConstraint.activate([
      webView.topAnchor.constraint(equalTo: topAnchor),
      webView.bottomAnchor.constraint(equalTo: bottomAnchor),
      webView.leadingAnchor.constraint(equalTo: leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: trailingAnchor)
    ])
  }

  func loadIfNeeded() {
    guard let pendingURL = pendingURL,
      webView.url != pendingURL else {
      return
    }

    webView.load(URLRequest(url: pendingURL))
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation?) {
    guard let url = webView.url?.absoluteString else {
      return
    }

    onLoad(["url": url])
  }
}
