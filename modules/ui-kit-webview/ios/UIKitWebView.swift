import ExpoModulesCore
import UIKit
import WebKit

final class UIKitWebView: ExpoView, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
  let onError = EventDispatcher()
  let onContentProcessDidTerminate = EventDispatcher()
  let onLoadEnd = EventDispatcher()
  let onLoadStart = EventDispatcher()
  let onMessage = EventDispatcher()
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
  var debugRawTwitchPlayerBridge = false
  var injectedJavaScript: String?
  var javaScriptCommand: String? {
    didSet {
      guard javaScriptCommand != oldValue else {
        return
      }

      evaluateJavaScript(javaScriptCommand)
    }
  }
  var parent = "www.twitch.tv"
  var playerWebsiteUrl: String?
  var rawTwitchPlayerAutoplay = true
  var rawTwitchPlayerBridgeEnabled = false
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
    webView.configuration.userContentController.add(self, name: "foam")
    webView.configuration.userContentController.addUserScript(WKUserScript(
      source: """
        window.ReactNativeWebView = window.ReactNativeWebView || {};
        window.ReactNativeWebView.postMessage = function(message) {
          window.webkit.messageHandlers.foam.postMessage(String(message));
        };
      """,
      injectionTime: .atDocumentStart,
      forMainFrameOnly: false
    ))

    addSubview(webView)

    NSLayoutConstraint.activate([
      webView.topAnchor.constraint(equalTo: topAnchor),
      webView.bottomAnchor.constraint(equalTo: bottomAnchor),
      webView.leadingAnchor.constraint(equalTo: leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: trailingAnchor)
    ])
  }

  deinit {
    webView.configuration.userContentController.removeScriptMessageHandler(forName: "foam")
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
    evaluateJavaScript(injectedJavaScript)
    if rawTwitchPlayerBridgeEnabled {
      evaluateJavaScript(rawTwitchPlayerBridgeScript(
        autoplay: rawTwitchPlayerAutoplay,
        debug: debugRawTwitchPlayerBridge
      ))
    }
    sendNavigationEvent(onNavigationStateChange)
    sendNavigationEvent(onLoadEnd)
  }

  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    onMessage([
      "data": "\(message.body)"
    ])
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

  private func evaluateJavaScript(_ script: String?) {
    guard let script,
      !script.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      return
    }

    webView.evaluateJavaScript(script)
  }

  private func rawTwitchPlayerBridgeScript(autoplay: Bool, debug: Bool) -> String {
    """
    (function() {
      if (window.__foamRawTwitchPlayerBootstrapped) { return true; }
      window.__foamRawTwitchPlayerBootstrapped = true;
      var shouldAutoplay = \(autoplay ? "true" : "false");
      var enableTrace = \(debug ? "true" : "false");
      var hideAttempts = 0;
      var playbackStatsInterval = null;
      var pendingPauseTimer = null;
      var lastBlockedEventAt = 0;

      function post(type, payload) {
        if (type === 'trace' && !enableTrace) { return; }
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type,
            payload: payload || {}
          }));
        } catch (e) {}
      }

      function asyncQuerySelector(selector, timeout) {
        return new Promise(function(resolve) {
          var element = document.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }
          var observer = new MutationObserver(function() {
            element = document.querySelector(selector);
            if (!element) { return; }
            observer.disconnect();
            resolve(element);
          });
          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
          });
          if (timeout) {
            setTimeout(function() {
              observer.disconnect();
              resolve(undefined);
            }, timeout);
          }
        });
      }

      function hideElements() {
        [
          '.top-bar',
          '.player-controls',
          '#channel-player-disclosures',
          '[data-a-target="player-overlay-video-stats"]',
          '[data-a-target="player-overlay-play-button"]',
          '[data-a-target="player-overlay-click-handler"]',
          '[data-a-target="player-overlay-preview-background"]',
          '.player-overlay-background'
        ].forEach(function(selector) {
          document.querySelectorAll(selector).forEach(function(element) {
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('pointer-events', 'none', 'important');
          });
        });
      }

      function installOverlayHider() {
        hideElements();
        var observer = new MutationObserver(hideElements);
        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true
        });
        var interval = setInterval(function() {
          hideAttempts += 1;
          hideElements();
          if (hideAttempts >= 80) {
            clearInterval(interval);
          }
        }, 250);
      }

      function emitMuteState(video) {
        post('muteState', {
          muted: video ? video.muted : false,
          volume: video ? video.volume : 1
        });
      }

      function prepareInlineVideo(video) {
        if (!video) { return; }
        try {
          video.playsInline = true;
          video.controls = false;
          video.disablePictureInPicture = true;
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('x-webkit-airplay', 'deny');
          video.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
          video.removeAttribute('controls');
        } catch (e) {}
      }

      function emitPlaybackStats() {
        var statsText = document.querySelector('[aria-label="Latency To Broadcaster"]')?.textContent || '';
        var latency = Number.parseFloat(statsText);
        post('playbackStats', {
          bufferSize: null,
          displayResolution: null,
          fps: null,
          hlsLatencyBroadcaster: Number.isFinite(latency) ? latency : null,
          playbackRate: null,
          skippedFrames: null,
          videoResolution: null
        });
      }

      function startPlaybackStats() {
        emitPlaybackStats();
        if (!playbackStatsInterval) {
          playbackStatsInterval = setInterval(emitPlaybackStats, 2500);
        }
      }

      function stopPlaybackStats() {
        if (!playbackStatsInterval) { return; }
        clearInterval(playbackStatsInterval);
        playbackStatsInterval = null;
      }

      function postPlaybackBlocked() {
        var now = Date.now();
        if (now - lastBlockedEventAt < 2000) { return; }
        lastBlockedEventAt = now;
        post('playbackBlocked');
      }

      function installVideoBridge(video) {
        if (!video || video.__foamBridgeInstalled) { return; }
        video.__foamBridgeInstalled = true;
        prepareInlineVideo(video);
        video.muted = false;
        video.volume = 1;
        post('ready');
        emitMuteState(video);
        video.addEventListener('playing', function() {
          if (pendingPauseTimer) {
            clearTimeout(pendingPauseTimer);
            pendingPauseTimer = null;
          }
          video.muted = false;
          video.volume = 1;
          post('contentGateDetected', { hasContentGate: false });
          post('play');
          post('playing');
          post('stateUpdate', {
            isBuffering: false,
            isPaused: false,
            isReady: true,
            muted: video.muted,
            volume: video.volume
          });
          startPlaybackStats();
        });
        video.addEventListener('pause', function() {
          stopPlaybackStats();
          if (pendingPauseTimer) {
            clearTimeout(pendingPauseTimer);
          }
          pendingPauseTimer = setTimeout(function() {
            if (!video.paused) { return; }
            post('pause');
          }, 750);
        });
        video.addEventListener('ended', function() {
          stopPlaybackStats();
          post('ended');
        });
        video.addEventListener('volumechange', function() {
          emitMuteState(video);
        });
        if (shouldAutoplay) {
          var playResult = video.play();
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(postPlaybackBlocked);
          }
        }
      }

      window.playerControls = {
        getCurrentTime: function() {
          var video = document.querySelector('video');
          post('currentTime', { time: video ? video.currentTime : 0 });
        },
        getDuration: function() {
          var video = document.querySelector('video');
          post('duration', { duration: video ? video.duration : 0 });
        },
        mute: function() {
          var video = document.querySelector('video');
          if (!video) { return; }
          video.muted = true;
          emitMuteState(video);
        },
        pause: function() {
          var video = document.querySelector('video');
          if (video) { video.pause(); }
        },
        play: function() {
          var video = document.querySelector('video');
          if (!video) { return; }
          prepareInlineVideo(video);
          video.muted = false;
          video.volume = 1;
          var result = video.play();
          if (result && typeof result.catch === 'function') {
            result.catch(postPlaybackBlocked);
          }
        },
        seek: function(timestamp) {
          var video = document.querySelector('video');
          if (video && Number.isFinite(timestamp)) {
            video.currentTime = timestamp;
          }
        },
        seekToLive: function() {},
        setChannel: function() {},
        setMuted: function(nextMuted) {
          var video = document.querySelector('video');
          if (!video) { return; }
          prepareInlineVideo(video);
          video.muted = nextMuted;
          if (!nextMuted) {
            video.volume = 1;
          }
          emitMuteState(video);
        },
        setQuality: function() {},
        setVideo: function() {},
        setVolume: function(volume) {
          var video = document.querySelector('video');
          if (!video) { return; }
          prepareInlineVideo(video);
          video.volume = volume;
          if (volume > 0) {
            video.muted = false;
          }
          emitMuteState(video);
        },
        unmute: function() {
          var video = document.querySelector('video');
          if (!video) { return; }
          prepareInlineVideo(video);
          video.muted = false;
          video.volume = 1;
          emitMuteState(video);
        }
      };

      installOverlayHider();
      asyncQuerySelector('button[data-a-target*="content-classification-gate"]', 10000)
        .then(function(button) {
          if (!button) { return; }
          button.click();
        })
        .catch(function() {});
      asyncQuerySelector('video', 10000).then(installVideoBridge).catch(function() {});
      post('trace', { step: 'raw_player_native_bootstrap_installed' });
      return true;
    })();
    true;
    """
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
