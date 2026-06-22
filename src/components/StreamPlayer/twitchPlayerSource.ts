// Twitch's player embed expects a VOD start offset as `XhYmZs`, not seconds.
function formatTwitchTimeParam(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${hours}h${minutes}m${seconds}s`;
}

export function buildRawTwitchPlayerUrl(options: {
  autoplay: boolean;
  channel: string;
  muted: boolean;
  parent: string;
  /**
   * VOD resume offset in seconds; only applied when `video` is set.
   */
  timeSeconds?: number;
  video?: string;
}): string {
  const params = new URLSearchParams();

  if (options.video) {
    params.set('video', options.video);
    // Resume a VOD at its last known position so a WebView reload (memory
    // pressure / process termination) doesn't restart it from 0:00.
    if (options.timeSeconds && options.timeSeconds > 0) {
      params.set('time', formatTwitchTimeParam(options.timeSeconds));
    }
  } else {
    params.set('channel', options.channel);
  }

  if (!options.autoplay) {
    params.set('autoplay', 'false');
  }
  params.set('muted', options.muted ? 'true' : 'false');
  params.set('parent', options.parent);

  return `https://player.twitch.tv/?${params.toString()}`;
}

/**
 * Seeds the Twitch player's persisted quality choice before its JS boots.
 * Without it the player defaults to auto (often source/1080p60), which is
 * the dominant WebView CPU/bandwidth cost on a phone screen. The player
 * only honors the choice when both `video-quality` (named group) and
 * `quality-bitrate` (ABR cap in bps) are present — verified against
 * player.twitch.tv in Chromium, so this applies to the Android WebView.
 * On iOS it is a no-op: WKWebView gets native HLS where the OS owns
 * rendition selection (the player's quality menu only offers Auto there).
 * Only applies when no quality has been stored yet, so an existing choice
 * wins.
 */
export function buildTwitchPlayerQualityDefaultScript(options: {
  defaultQuality: string;
  maxBitrateBps: number;
}): string {
  return `
(function() {
  try {
    if (!window.localStorage.getItem('video-quality')) {
      window.localStorage.setItem(
        'video-quality',
        JSON.stringify({ default: ${JSON.stringify(options.defaultQuality)} })
      );
      window.localStorage.setItem(
        'quality-bitrate',
        ${JSON.stringify(String(options.maxBitrateBps))}
      );
    }
  } catch (e) {}
})();
true;`;
}

/**
 * Drives playback on the stock (unscripted) player so a stream doesn't sit
 * paused/muted after load. Twitch's embed frequently honours neither the
 * `muted=false` URL param (it restores a stored mute preference) nor unmuted
 * autoplay on its own, leaving the video paused or silent. This locates the
 * <video> element, sets it unmuted at full volume, and calls play().
 *
 * The first play() is deferred past the WKWebView init window: starting the
 * inline video too early intermittently leaves its AVPlayer layer out of the
 * compositor (audio advances, picture is black). The deferral plus the
 * StreamPlayer layout nudge keep playback off that race. A blocked unmuted
 * play() falls back to muted playback so the stream is at least moving, and a
 * later retry unmutes it once it is running.
 */
export function buildTwitchAutoplayEnsureScript(options: {
  muted: boolean;
  startDelayMs?: number;
}): string {
  const startDelayMs = Math.max(0, options.startDelayMs ?? 800);
  return `
(function() {
  if (window.__foamAutoplayEnsureInstalled) { return true; }
  window.__foamAutoplayEnsureInstalled = true;

  var TARGET_MUTED = ${options.muted ? 'true' : 'false'};
  var START_DELAY_MS = ${startDelayMs};

  function applyAudio(video) {
    try {
      video.muted = TARGET_MUTED;
      if (!TARGET_MUTED) { video.volume = 1; }
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.removeAttribute('controls');
    } catch (e) {}
  }

  function ensurePlaying(video) {
    if (!video) { return; }
    applyAudio(video);
    if (!video.paused) { return; }
    var result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(function() {
        if (!TARGET_MUTED) {
          try {
            video.muted = true;
            var muted = video.play();
            if (muted && typeof muted.catch === 'function') {
              muted.catch(function() {});
            }
          } catch (e) {}
        }
      });
    }
  }

  function attach(video) {
    if (!video || video.__foamAutoplayEnsure) { return; }
    video.__foamAutoplayEnsure = true;
    [0, 800, 1800, 3200].forEach(function(delay) {
      setTimeout(function() { ensurePlaying(video); }, START_DELAY_MS + delay);
    });
    video.addEventListener('loadeddata', function() { ensurePlaying(video); });
    video.addEventListener('canplay', function() { ensurePlaying(video); });
  }

  var existing = document.querySelector('video');
  if (existing) { attach(existing); return true; }

  var observer = new MutationObserver(function() {
    var video = document.querySelector('video');
    if (video) { observer.disconnect(); attach(video); }
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
  return true;
})();
true;`;
}

export function buildRawTwitchPlayerBootstrapScript(options: {
  autoplay: boolean;
  debug: boolean;
  muted: boolean;
  /**
   * When > 0 the page is loaded with autoplay=false and playback is started
   * by this script after the delay. Starting the inline video while the
   * WKWebView is still initialising intermittently leaves its AVPlayer
   * layer out of the compositor (sound/time advance, picture black/frozen);
   * deferring the first play() past that window avoids the race.
   */
  deferStartMs?: number;
}): string {
  return `
(function() {
  if (window.__foamRawTwitchPlayerBootstrapped) {
    return true;
  }
  window.__foamRawTwitchPlayerBootstrapped = true;
  var shouldAutoplay = ${options.autoplay ? 'true' : 'false'};
  var deferStartMs = ${Math.max(0, options.deferStartMs ?? 0)};
  var startAllowed = deferStartMs <= 0;
  var enableTrace = ${options.debug ? 'true' : 'false'};
  var targetMuted = ${options.muted ? 'true' : 'false'};
  var hideAttempts = 0;
  var playbackStatsInterval = null;
  var pendingPauseTimer = null;
  var playbackRecoveryTimers = [];
  var userPaused = !shouldAutoplay;
  var lastBlockedEventAt = 0;

  function post(type, payload) {
    if (type === 'trace' && !enableTrace) {
      return;
    }

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
        if (!element) {
          return;
        }
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
    var selectors = [
      '.persistent-player',
      '.top-bar',
      '.player-controls',
      '.player-overlay-background',
      '.twilight-player-overlay',
      '#channel-player-disclosures',
      '[data-a-target="player-controls"]',
      '[data-a-target="player-overlay-click-handler"]',
      '[data-a-target="player-overlay-mature-accept"]',
      '[data-a-target="player-overlay-play-button"]',
      '[data-a-target="player-overlay-preview-background"]',
      '[data-a-target="player-overlay-video-stats"]',
      '[data-a-target="top-bar"]',
      '[data-a-target*="player-controls"]',
      '[data-a-target*="player-overlay"]',
      '[class*="Controls"]',
      '[class*="controls"]'
    ];

    selectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(element) {
        if (element.tagName === 'VIDEO' || element.querySelector('video')) {
          return;
        }
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('pointer-events', 'none', 'important');
      });
    });

    prepareInlineVideo(document.querySelector('video'));
  }

  function installControlHiderStyle() {
    if (document.getElementById('foam-twitch-control-hide-style')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'foam-twitch-control-hide-style';
    style.textContent = [
      '.top-bar',
      '.player-controls',
      '.player-overlay-background',
      '.twilight-player-overlay',
      '#channel-player-disclosures',
      '[data-a-target="player-controls"]',
      '[data-a-target="player-overlay-click-handler"]',
      '[data-a-target="player-overlay-play-button"]',
      '[data-a-target="player-overlay-preview-background"]',
      '[data-a-target="player-overlay-video-stats"]',
      '[data-a-target="top-bar"]',
      '[data-a-target*="player-controls"]',
      '[data-a-target*="player-overlay"]',
      '[class*="Controls"]',
      '[class*="controls"]',
      'video::-webkit-media-controls',
      'video::-webkit-media-controls-enclosure',
      'video::-webkit-media-controls-panel',
      'video::-webkit-media-controls-play-button',
      'video::-webkit-media-controls-start-playback-button'
    ].join(',') + '{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function installOverlayHider() {
    installControlHiderStyle();
    hideElements();

    // The player DOM mutates constantly; running the selector sweep on every
    // mutation burned WebContent CPU for no benefit since the injected CSS
    // already hides new nodes. Coalesce bursts into one sweep per 250ms.
    var hideQueued = false;
    function scheduleHideElements() {
      if (hideQueued) {
        return;
      }
      hideQueued = true;
      setTimeout(function() {
        hideQueued = false;
        hideElements();
      }, 250);
    }

    var observer = new MutationObserver(scheduleHideElements);
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

  function acceptContentWarning() {
    asyncQuerySelector('button[data-a-target*="content-classification-gate"]', 10000)
      .then(function(button) {
        if (!button) {
          return;
        }
        button.click();
      })
      .catch(function() {});
  }

  function emitMuteState(video) {
    post('muteState', {
      muted: video ? video.muted : false,
      volume: video ? video.volume : 1
    });
  }

  // Hide captions by switching the first text track to 'hidden' (never
  // 'disabled'). 'disabled' makes WKWebView's native HLS AVPlayer drop and
  // renegotiate the rendition, which stalls playback; 'hidden' keeps the track
  // loaded but unrendered. No ::-webkit-media-text-track CSS for the same
  // reason. Re-applied on playing/pause since Twitch re-enables CC across ads.
  function hideCaptions(video) {
    try {
      if (video && video.textTracks && video.textTracks.length > 0) {
        video.textTracks[0].mode = 'hidden';
      }
    } catch (e) {}
  }

  function prepareInlineVideo(video) {
    if (!video) {
      return;
    }

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

  var lastPostedPlaybackLatency = undefined;
  function emitPlaybackStats() {
    var statsText = document.querySelector('[aria-label="Latency To Broadcaster"]')?.textContent || '';
    var latency = Number.parseFloat(statsText);
    var nextLatency = Number.isFinite(latency) ? latency : null;
    if (
      lastPostedPlaybackLatency === nextLatency ||
      (
        typeof lastPostedPlaybackLatency === 'number' &&
        typeof nextLatency === 'number' &&
        Math.abs(lastPostedPlaybackLatency - nextLatency) < 0.25
      )
    ) {
      return;
    }
    lastPostedPlaybackLatency = nextLatency;
    post('playbackStats', {
      bufferSize: null,
      displayResolution: null,
      fps: null,
      hlsLatencyBroadcaster: nextLatency,
      playbackRate: null,
      skippedFrames: null,
      videoResolution: null
    });
  }

  function startPlaybackStats() {
    emitPlaybackStats();
    if (playbackStatsInterval) {
      return;
    }
    playbackStatsInterval = setInterval(emitPlaybackStats, 2500);
  }

  function stopPlaybackStats() {
    if (!playbackStatsInterval) {
      return;
    }
    clearInterval(playbackStatsInterval);
    playbackStatsInterval = null;
  }

  function clearPendingPause() {
    if (!pendingPauseTimer) {
      return;
    }
    clearTimeout(pendingPauseTimer);
    pendingPauseTimer = null;
  }

  function postPauseIfStillPaused(video) {
    pendingPauseTimer = null;
    if (video && !video.paused) {
      return;
    }
    if (shouldAutoplay && !userPaused) {
      schedulePlaybackRecovery();
      return;
    }
    post('pause');
  }

  function postPlaybackBlocked(errName) {
    var now = Date.now();
    if (now - lastBlockedEventAt < 2000) {
      return;
    }
    lastBlockedEventAt = now;
    post('playbackBlocked', { errName: errName || null });
  }

  function clearPlaybackRecoveryTimers() {
    playbackRecoveryTimers.forEach(function(timer) {
      clearTimeout(timer);
    });
    playbackRecoveryTimers = [];
  }

  function clickPlayButton() {
    try {
      var button = document.querySelector(
        '[data-a-target="player-overlay-play-button"], [data-a-target="player-play-pause-button"], button[aria-label="Play"]'
      );
      if (button) {
        button.click();
      }
    } catch (e) {}
  }

  function playVideo(video) {
    if (!video) {
      clickPlayButton();
      return;
    }

    if (!video.currentSrc && !video.src) {
      clickPlayButton();
    }

    prepareInlineVideo(video);
    video.muted = targetMuted;
    if (!targetMuted) {
      video.volume = 1;
    }
    var result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(function(e) {
        postPlaybackBlocked(e && e.name);
      });
    }
  }

  // Watches for the playback position freezing while the player believes it
  // is playing (silent HLS death, decoder stall). The compositor blank found
  // in the TestFlight investigation is invisible to the page, so this only
  // covers stalls the video element itself experiences — but those were
  // previously just as silent.
  var watchdogStarted = false;
  var watchdogLastTime = -1;
  var stalledAtMs = 0;
  var stallReported = false;
  function startPlaybackWatchdog() {
    if (watchdogStarted) {
      return;
    }
    watchdogStarted = true;
    setInterval(function() {
      var video = document.querySelector('video');
      if (!video || video.paused || userPaused || !startAllowed) {
        watchdogLastTime = video ? video.currentTime : -1;
        stalledAtMs = 0;
        stallReported = false;
        return;
      }

      var t = video.currentTime;
      var advanced = watchdogLastTime < 0 || t - watchdogLastTime >= 0.1;
      watchdogLastTime = t;

      if (advanced) {
        if (stallReported) {
          post('playbackRecovered', { stalledMs: Date.now() - stalledAtMs });
        }
        stalledAtMs = 0;
        stallReported = false;
        return;
      }

      if (!stalledAtMs) {
        stalledAtMs = Date.now();
        return;
      }

      if (!stallReported && Date.now() - stalledAtMs >= 6000) {
        stallReported = true;
        post('playbackStalled', {
          currentTime: t,
          readyState: video.readyState,
          networkState: video.networkState,
          stalledMs: Date.now() - stalledAtMs
        });
      }
    }, 3000);
  }

  function schedulePlaybackRecovery() {
    if (!shouldAutoplay || userPaused || !startAllowed) {
      return;
    }

    clearPlaybackRecoveryTimers();
    requestAnimationFrame(function() {
      playVideo(document.querySelector('video'));
    });
    playbackRecoveryTimers.push(setTimeout(function() {
      playVideo(document.querySelector('video'));
    }, 250));
    playbackRecoveryTimers.push(setTimeout(function() {
      playVideo(document.querySelector('video'));
    }, 1000));
  }

  function installVideoBridge(video) {
    if (!video || video.__foamBridgeInstalled) {
      return;
    }

    video.__foamBridgeInstalled = true;
    prepareInlineVideo(video);
    if (!video.paused) {
      hideCaptions(video);
    }
    video.muted = targetMuted;
    if (!targetMuted) {
      video.volume = 1;
    }
    post('ready');
    emitMuteState(video);

    video.addEventListener('playing', function() {
      clearPendingPause();
      clearPlaybackRecoveryTimers();
      userPaused = false;
      hideCaptions(video);
      video.muted = targetMuted;
      if (!targetMuted) {
        video.volume = 1;
      }
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
      clearPendingPause();
      stopPlaybackStats();
      hideCaptions(video);
      schedulePlaybackRecovery();
      pendingPauseTimer = setTimeout(function() {
        postPauseIfStillPaused(video);
      }, 750);
    });

    video.addEventListener('ended', function() {
      stopPlaybackStats();
      post('ended');
    });

    video.addEventListener('error', function() {
      post('videoElementError', {
        code: video.error ? video.error.code : null,
        message: video.error && video.error.message ? video.error.message : '',
        readyState: video.readyState,
        networkState: video.networkState
      });
    });

    startPlaybackWatchdog();

    video.addEventListener('volumechange', function() {
      emitMuteState(video);
    });

    if (shouldAutoplay) {
      if (startAllowed) {
        playVideo(video);
        schedulePlaybackRecovery();
      } else {
        setTimeout(function() {
          startAllowed = true;
          playVideo(video);
          schedulePlaybackRecovery();
        }, deferStartMs);
      }
    }

    if (!video.paused) {
      post('playing');
    }
  }

  function installPlayerControls() {
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
        userPaused = true;
        clearPlaybackRecoveryTimers();
        var video = document.querySelector('video');
        if (video) { video.pause(); }
      },
      play: function() {
        userPaused = false;
        startAllowed = true;
        var video = document.querySelector('video');
        playVideo(video);
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
  }

  installOverlayHider();
  installPlayerControls();
  acceptContentWarning();
  asyncQuerySelector('video', 10000).then(function(video) {
    if (!video) {
      // With autoplay=false the player may not create the video element
      // until something starts playback; press play and look again.
      clickPlayButton();
      asyncQuerySelector('video', 10000).then(installVideoBridge).catch(function() {});
      return;
    }
    installVideoBridge(video);
  }).catch(function() {});
  window.addEventListener('resize', schedulePlaybackRecovery);
  window.addEventListener('orientationchange', schedulePlaybackRecovery);
  window.addEventListener('pageshow', schedulePlaybackRecovery);
  document.addEventListener('visibilitychange', schedulePlaybackRecovery);
  post('trace', { step: 'raw_player_bootstrap_installed' });
  return true;
})();
true;`;
}

/**
 * Hides Twitch's auto-enabled closed captions on the stock (unscripted) player
 * page. Sets the first text track to 'hidden' rather than 'disabled':
 * 'disabled' makes WKWebView's native HLS AVPlayer drop and renegotiate the
 * rendition, which stalls/starves playback. 'hidden' keeps the track loaded but
 * unrendered, and deliberately touches no ::-webkit-media-text-track CSS. The
 * playing/pause listeners re-apply it because Twitch re-enables CC across ads.
 */
export function buildTwitchCaptionHiderScript(): string {
  return `
(function() {
  if (window.__foamCaptionHiderInstalled) { return true; }
  window.__foamCaptionHiderInstalled = true;

  function hide(video) {
    try {
      if (video && video.textTracks && video.textTracks.length > 0) {
        video.textTracks[0].mode = 'hidden';
      }
    } catch (e) {}
  }

  function attach(video) {
    if (!video || video.__foamCaptionHider) { return; }
    video.__foamCaptionHider = true;
    video.addEventListener('playing', function() { hide(video); });
    video.addEventListener('pause', function() { hide(video); });
    if (!video.paused) { hide(video); }
  }

  var existing = document.querySelector('video');
  if (existing) {
    attach(existing);
    return true;
  }

  var observer = new MutationObserver(function() {
    var video = document.querySelector('video');
    if (video) {
      observer.disconnect();
      attach(video);
    }
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
  return true;
})();
true;`;
}

export function buildTwitchClipPlayerUrl(options: {
  autoplay: boolean;
  clip: string;
  muted: boolean;
  parent: string;
  preload?: 'auto' | 'metadata' | 'none';
}): string {
  const params = new URLSearchParams({
    clip: options.clip,
    parent: options.parent,
    autoplay: options.autoplay ? 'true' : 'false',
    muted: options.muted ? 'true' : 'false',
    preload: options.preload ?? 'metadata',
  });

  return `https://clips.twitch.tv/embed?${params.toString()}`;
}

export function isAppUrl(url: string): boolean {
  return url.startsWith('foam://') || url.startsWith('exp+foam://');
}

export function isTwitchPassportCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'www.twitch.tv' &&
      parsed.pathname.startsWith('/passport-callback')
    );
  } catch {
    return false;
  }
}

/**
 * Auto-accepts Twitch's mature-content classification gate: clicks the
 * "Continue" button as soon as it appears. parent=www.twitch.tv makes Twitch
 * render the anonymous gate rather than a login-required one.
 */
export function buildTwitchContentGateAcceptScript(): string {
  return `
(function() {
  if (window.__foamContentGateAcceptInstalled) { return true; }
  window.__foamContentGateAcceptInstalled = true;

  function asyncQuerySelector(selector, timeout) {
    return new Promise(function(resolve) {
      var el = document.querySelector(selector);
      if (el) { resolve(el); return; }
      var observer = new MutationObserver(function() {
        el = document.querySelector(selector);
        if (el) { observer.disconnect(); resolve(el); }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      if (timeout) {
        setTimeout(function() { observer.disconnect(); resolve(undefined); }, timeout);
      }
    });
  }

  asyncQuerySelector('button[data-a-target*="content-classification-gate"]', 10000)
    .then(function(button) { if (button) { button.click(); } })
    .catch(function() {});
  return true;
})();
true;`;
}

/**
 * Hides the stock player's chrome so only the video shows when foam draws its
 * own overlay controls: hides .top-bar, .player-controls and
 * #channel-player-disclosures, re-applying them as the .video-player__overlay
 * subtree mutates.
 */
export function buildTwitchOverlayHideScript(): string {
  return `
(function() {
  if (window.__foamOverlayHideInstalled) { return true; }
  window.__foamOverlayHideInstalled = true;

  function hide() {
    [
      document.querySelector('.top-bar'),
      document.querySelector('.player-controls'),
      document.querySelector('#channel-player-disclosures')
    ].forEach(function(el) {
      if (el) { el.style.setProperty('display', 'none', 'important'); }
    });
  }

  var overlayObserver = null;
  var observedOverlay = null;

  var observer = new MutationObserver(function() {
    var videoOverlay = document.querySelector('.video-player__overlay');
    if (!videoOverlay || videoOverlay === observedOverlay) { return; }
    if (overlayObserver) { overlayObserver.disconnect(); }
    observedOverlay = videoOverlay;
    hide();
    overlayObserver = new MutationObserver(hide);
    overlayObserver.observe(videoOverlay, {
      childList: true,
      subtree: true
    });
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
  return true;
})();
true;`;
}
