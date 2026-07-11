import { PIP_ENABLED } from '../pipFeature';

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
      // When enabled, the native overlay's PiP button drives PiP via
      // webkitSetPresentationMode.
      video.disablePictureInPicture = ${String(!PIP_ENABLED)};
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('x-webkit-airplay', 'deny');
      video.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
      video.removeAttribute('controls');
    } catch (e) {}
  }

  var lastPostedPlaybackLatency = undefined;
  function emitPlaybackStats() {
    var statsNode = document.querySelector('[aria-label="Latency To Broadcaster"]');
    var statsText = (statsNode && statsNode.textContent) || '';
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
  function isAdActive() {
    return !!document.querySelector(
      '[data-a-target="video-ad-label"],[data-a-target="video-ad-countdown"],.video-player__ad-info-container,[data-test-selector="ad-banner-default-text-area__content"]'
    );
  }
  function startPlaybackWatchdog() {
    if (watchdogStarted) {
      return;
    }
    watchdogStarted = true;
    setInterval(function() {
      var video = document.querySelector('video');
      if (!video || video.paused || userPaused || !startAllowed || isAdActive()) {
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

  // Live-edge catch-up: speed up slightly when behind, hard-seek on egregious drift.
  var LIVE_SYNC_TARGET_S = 4;
  var LIVE_SYNC_TRIGGER_S = 8;
  var LIVE_SYNC_SEEK_S = 30;
  var LIVE_SYNC_RATE = 1.05;
  var liveSyncStarted = false;
  var liveSyncActive = false;

  function setPlaybackRate(video, rate) {
    try {
      if (video.playbackRate !== rate) {
        video.preservesPitch = true;
        video.playbackRate = rate;
      }
    } catch (e) {}
  }

  function resetPlaybackRate(video) {
    if (!video) { return; }
    liveSyncActive = false;
    setPlaybackRate(video, 1);
  }

  function adjustLiveSync(video) {
    if (!video || video.paused || userPaused || !startAllowed) {
      if (video) { resetPlaybackRate(video); }
      return;
    }

    var seekable = video.seekable;
    if (!seekable || seekable.length === 0) {
      return;
    }

    var liveEdge = seekable.end(seekable.length - 1);
    var drift = liveEdge - video.currentTime;
    if (!isFinite(drift) || drift < 0) {
      return;
    }

    if (drift > LIVE_SYNC_SEEK_S) {
      try { video.currentTime = liveEdge - LIVE_SYNC_TARGET_S; } catch (e) {}
      resetPlaybackRate(video);
      return;
    }

    if (drift > LIVE_SYNC_TRIGGER_S) {
      liveSyncActive = true;
      setPlaybackRate(video, LIVE_SYNC_RATE);
    } else if (liveSyncActive && drift <= LIVE_SYNC_TARGET_S) {
      resetPlaybackRate(video);
    }
  }

  function startLiveSync() {
    if (liveSyncStarted) {
      return;
    }
    liveSyncStarted = true;
    setInterval(function() {
      adjustLiveSync(document.querySelector('video'));
    }, 2000);
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
      resetPlaybackRate(video);
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
    startLiveSync();

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
