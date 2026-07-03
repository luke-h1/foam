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
 * Seeds the Twitch player's persisted mute/volume choice before its JS boots,
 * mirroring the quality seed above. WKWebView keeps localStorage across
 * sessions, and Twitch's embed restores `video-muted` from it (ignoring the
 * `muted=false` URL param) — so once a muted-autoplay run has stored
 * `video-muted: true`, every later open boots muted, and the after-load ensure
 * script then fights WebKit's policy (unmuting a muted autoplay can re-pause
 * it), leaving the stream paused/muted. Writing the desired state up front lets
 * the player autoplay in that state cleanly (autoplay is permitted because the
 * WebView sets mediaPlaybackRequiresUserAction=false). Forced, not conditional:
 * the app owns the mute state via `initialMuted`, so it must win over whatever
 * Twitch last stored.
 */
export function buildTwitchPlayerAudioDefaultScript(options: {
  muted: boolean;
}): string {
  return `
(function() {
  try {
    window.localStorage.setItem(
      'video-muted',
      JSON.stringify({ default: ${options.muted ? 'true' : 'false'} })
    );
    window.localStorage.setItem('volume', '1');
  } catch (e) {}
})();
true;`;
}

/**
 * Drives playback on the stock (unscripted) player so a stream never sits
 * paused after load. Twitch's embed honours neither the `muted=false` URL param
 * nor unmuted autoplay reliably, and on iOS an unmuted play() resolves but is
 * then silently re-paused by WebKit (no rejection to catch) — leaving the video
 * stuck on the play button. This guarantees playback: it tries the requested
 * audio state, and on any pause — a rejected play() OR a silent re-pause —
 * falls back to muted playback so the picture is always moving. Once unmuting a
 * playing video makes WebKit re-pause it, it stops fighting and stays muted
 * (a later user tap can unmute), which avoids an unmute/re-pause oscillation.
 *
 * The first attempt is deferred past the WKWebView init window: starting the
 * inline video too early intermittently leaves its AVPlayer layer out of the
 * compositor (audio advances, picture is black). The deferral plus the
 * StreamPlayer layout nudge keep playback off that race.
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
  var unmuteBlocked = false;
  // One-shot autoplay guard: set on first play and by native pause.
  var stopped = false;

  function prepare(video) {
    try {
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.removeAttribute('controls');
    } catch (e) {}
  }

  function playMuted(video) {
    try {
      video.muted = true;
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function() {}); }
    } catch (e) {}
  }

  function postMuteState(video) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'muteState',
        payload: {
          muted: !!video.muted,
          volume: typeof video.volume === 'number' ? video.volume : 1
        }
      }));
    } catch (e) {}
  }

  var unmuteAttempts = 0;

  // Unmute the already-playing stream; iOS re-pauses cold unmuted autoplay, so retry then accept muted.
  function reconcileAudio(video) {
    if (TARGET_MUTED) {
      if (!video.muted) { video.muted = true; }
      return;
    }
    if (unmuteBlocked) { return; }
    video.muted = false;
    video.volume = 1;
    setTimeout(function() {
      var v = document.querySelector('video');
      if (!v || TARGET_MUTED || !v.paused) { return; }
      unmuteAttempts++;
      if (unmuteAttempts >= 3) {
        unmuteBlocked = true;
        playMuted(v);
        return;
      }
      var p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function() { unmuteBlocked = true; playMuted(v); });
      }
      setTimeout(function() {
        reconcileAudio(document.querySelector('video'));
      }, 250);
    }, 250);
  }

  function ensurePlaying(video) {
    if (stopped || !video) { return; }
    prepare(video);

    if (!video.paused) {
      // Already playing: go inert so we never force play over a user/native pause.
      stopped = true;
      reconcileAudio(video);
      return;
    }

    // Always start muted: iOS blocks unmuted autoplay; reconcileAudio raises volume once playing.
    try {
      video.muted = true;
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function() {});
      }
    } catch (e) {}
  }

  function tick() {
    ensurePlaying(document.querySelector('video'));
  }

  // Retry play until the video starts or a deadline; stops on first play. Re-callable from native.
  window.__foamEnsurePlaying = function() {
    stopped = false;
    var deadline = Date.now() + 12000;
    function pump() {
      if (stopped) { return; }
      var video = document.querySelector('video');
      if (video && !video.paused) { return; }
      tick();
      if (Date.now() < deadline) { setTimeout(pump, 600); }
    }
    pump();
  };

  // Native calls this on pause so the loop stops fighting teardown.
  window.__foamStopEnsurePlaying = function() {
    stopped = true;
  };

  // User mute toggle: stop the loop, pin unmuteBlocked, re-kick play if an unmute re-pauses.
  window.__foamSetMuted = function(nextMuted) {
    try {
      stopped = true;
      unmuteBlocked = true;
      var video = document.querySelector('video');
      if (!video) { return; }
      video.muted = !!nextMuted;
      if (!nextMuted) {
        video.volume = 1;
        if (video.paused) {
          var p = video.play();
          if (p && typeof p.catch === 'function') { p.catch(function() {}); }
          setTimeout(function() {
            if (video.paused && !video.muted) {
              var p2 = video.play();
              if (p2 && typeof p2.catch === 'function') { p2.catch(function() {}); }
            }
          }, 150);
        }
      }
      postMuteState(video);
    } catch (e) {}
  };

  function attach(video) {
    if (!video || video.__foamAutoplayEnsure) { return; }
    video.__foamAutoplayEnsure = true;
    video.addEventListener('loadeddata', tick);
    video.addEventListener('canplay', tick);
    // Reconcile audio as soon as playback is confirmed.
    video.addEventListener('playing', tick);
    video.addEventListener('volumechange', function() { postMuteState(video); });
    postMuteState(video);
  }

  setTimeout(window.__foamEnsurePlaying, START_DELAY_MS);

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
      // PiP stays available: the native overlay's PiP button drives it via
      // webkitSetPresentationMode.
      video.disablePictureInPicture = false;
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

/**
 * iOS-only picture-in-picture bridge for the embed's <video>. Exposes a
 * toggle (called from the native overlay button) that drives WKWebView's
 * webkitSetPresentationMode, and reports presentation-mode changes so the
 * native side can skip its background-pause while PiP is showing.
 */
export function buildTwitchPipBridgeScript(): string {
  return `
(function() {
  if (window.__foamPipBridgeInstalled) { return true; }
  window.__foamPipBridgeInstalled = true;

  function post(message) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } catch (e) {}
  }

  function attach() {
    var video = document.querySelector('video');
    if (!video || video.__foamPipHooked) { return; }
    video.__foamPipHooked = true;
    video.disablePictureInPicture = false;
    video.addEventListener('webkitpresentationmodechanged', function() {
      post({
        type: 'pipChanged',
        payload: { active: video.webkitPresentationMode === 'picture-in-picture' }
      });
    });
  }

  window.__foamTogglePictureInPicture = function() {
    var video = document.querySelector('video');
    var supportsPip =
      video &&
      typeof video.webkitSetPresentationMode === 'function' &&
      (typeof video.webkitSupportsPresentationMode !== 'function' ||
        video.webkitSupportsPresentationMode('picture-in-picture'));
    if (!supportsPip) {
      post({ type: 'pipUnavailable' });
      return;
    }
    attach();
    try {
      video.webkitSetPresentationMode(
        video.webkitPresentationMode === 'picture-in-picture'
          ? 'inline'
          : 'picture-in-picture'
      );
    } catch (e) {
      post({ type: 'pipUnavailable' });
    }
  };

  attach();
  // Twitch swaps the <video> element across ads and quality changes; re-hook
  // the replacement so mode changes keep reporting.
  setInterval(attach, 3000);
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

/**
 * Drives Twitch's hidden Video Stats overlay to read broadcaster latency and
 * posts it to the bridge as `playbackStats { hlsLatencyBroadcaster }`.
 */
export function buildTwitchLatencyTrackerScript(): string {
  return `
(function() {
  if (window.__foamLatencyTrackerInstalled) { return true; }
  window.__foamLatencyTrackerInstalled = true;

  var LATENCY_NODE = '[aria-label="Latency To Broadcaster"]';
  var STATS_OVERLAY_HIDE_ID = 'foam-stats-overlay-hide';
  var SETTINGS_MENU_HIDE_ID = 'foam-settings-menu-hide';

  function post(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {}
      }));
    } catch (e) {}
  }

  function ensureStyle(id, css) {
    if (document.getElementById(id)) { return; }
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle(id) {
    var existing = document.getElementById(id);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  // Ads tear down the latency node — skip while one is playing.
  function isAdActive() {
    return !!document.querySelector(
      '[data-a-target="video-ad-label"],[data-a-target="video-ad-countdown"],.video-player__ad-info-container,[data-test-selector="ad-banner-default-text-area__content"]'
    );
  }

  // Keep the stats overlay hidden for the session.
  ensureStyle(
    STATS_OVERLAY_HIDE_ID,
    '[data-a-target="player-overlay-video-stats"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
  );

  function asyncQuerySelector(selector, timeout) {
    return new Promise(function(resolve) {
      var existing = document.querySelector(selector);
      if (existing) { resolve(existing); return; }
      var timeoutId;
      var observer = new MutationObserver(function() {
        var element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(element);
        }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      timeoutId = setTimeout(function() {
        observer.disconnect();
        resolve(undefined);
      }, timeout || 8000);
    });
  }

  var enableInFlight = false;
  var enableAttempts = 0;
  var hadLatencyNode = false;

  async function enableVideoStats() {
    if (enableInFlight) { return; }
    enableInFlight = true;
    // Hide the settings menu only while we drive it; safety timer always restores it.
    ensureStyle(
      SETTINGS_MENU_HIDE_ID,
      '[data-a-target="player-settings-menu"]{display:none!important;visibility:hidden!important;opacity:0!important;}'
    );
    var safety = setTimeout(function() { removeStyle(SETTINGS_MENU_HIDE_ID); }, 6000);
    try {
      var settingsButton = await asyncQuerySelector('[data-a-target="player-settings-button"]', 10000);
      if (!settingsButton) { return; }
      settingsButton.click();

      var advancedItem = await asyncQuerySelector('[data-a-target="player-settings-menu-item-advanced"]');
      if (!advancedItem) { settingsButton.click(); return; }
      advancedItem.click();

      var statsCheckbox = await asyncQuerySelector('[data-a-target="player-settings-submenu-advanced-video-stats"] input');
      if (statsCheckbox && !statsCheckbox.checked) { statsCheckbox.click(); }

      settingsButton.click();
      post('trace', { step: 'latency', detail: 'enable attempt ' + enableAttempts + (statsCheckbox ? ' toggled' : ' no-checkbox') });
    } catch (e) {
    } finally {
      clearTimeout(safety);
      // Let the close click unmount the menu before revealing it.
      setTimeout(function() {
        removeStyle(SETTINGS_MENU_HIDE_ID);
        enableInFlight = false;
      }, 350);
    }
  }

  var lastPosted = undefined;
  function readLatency() {
    var element = document.querySelector(LATENCY_NODE);
    var text = element && element.textContent ? element.textContent.trim() : '';
    var match = text.match(/([0-9.]+)\\s*sec/i);
    var next = null;
    if (match) {
      var parsed = Number.parseFloat(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) { next = parsed; }
    }
    if (next === null) {
      if (text) { post('trace', { step: 'latency', detail: 'unparsed "' + text + '"' }); }
      return;
    }
    if (
      lastPosted === next ||
      (typeof lastPosted === 'number' && Math.abs(lastPosted - next) < 0.25)
    ) {
      return;
    }
    lastPosted = next;
    post('playbackStats', {
      bufferSize: null,
      displayResolution: null,
      fps: null,
      hlsLatencyBroadcaster: next,
      playbackRate: null,
      skippedFrames: null,
      videoResolution: null
    });
  }

  function tick() {
    if (isAdActive()) {
      // Refresh the enable budget so stats re-enable after the ad.
      enableAttempts = 0;
      hadLatencyNode = false;
      return;
    }
    if (!document.querySelector(LATENCY_NODE)) {
      // Lost a node we had (ad/reset): refresh the budget.
      if (hadLatencyNode) {
        hadLatencyNode = false;
        enableAttempts = 0;
      }
      if (enableAttempts < 12 && !enableInFlight) {
        enableAttempts += 1;
        enableVideoStats();
      }
      return;
    }
    hadLatencyNode = true;
    enableAttempts = 0;
    readLatency();
  }

  function start() {
    tick();
    setInterval(tick, 4000);
  }

  if (document.querySelector('video')) {
    start();
  } else {
    var boot = new MutationObserver(function() {
      if (document.querySelector('video')) {
        boot.disconnect();
        start();
      }
    });
    boot.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    setTimeout(function() { boot.disconnect(); start(); }, 10000);
  }

  return true;
})();
true;`;
}

/**
 * Seeks a live stream's playhead to the live edge to trim client-side latency.
 * Runs once at start and exposes `window.__foamSyncToLive()` for on-demand
 * re-triggers.
 */
export function buildTwitchLiveSyncScript(options: {
  targetSeconds?: number;
}): string {
  const targetSeconds = options.targetSeconds ?? 3;
  return `
(function() {
  if (window.__foamLiveSyncInstalled) { return true; }
  window.__foamLiveSyncInstalled = true;

  var TARGET_S = ${targetSeconds};

  function post(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {}
      }));
    } catch (e) {}
  }

  // Ads run on their own video element; seeking is wrong.
  function isAdActive() {
    return !!document.querySelector(
      '[data-a-target="video-ad-label"],[data-a-target="video-ad-countdown"],.video-player__ad-info-container,[data-test-selector="ad-banner-default-text-area__content"]'
    );
  }

  // Seek to the live edge once; no-op if within target or during an ad.
  window.__foamSyncToLive = function() {
    if (isAdActive()) {
      post('trace', { step: 'livesync', detail: 'skipped (ad playing)' });
      return false;
    }
    var video = document.querySelector('video');
    if (!video) {
      post('trace', { step: 'livesync', detail: 'no video element' });
      return false;
    }
    var seekable = video.seekable;
    if (!seekable || seekable.length === 0) {
      // Low-latency live can expose no seekable range — can't seek.
      post('trace', { step: 'livesync', detail: 'no seekable range' });
      return false;
    }

    var liveEdge = seekable.end(seekable.length - 1);
    var drift = liveEdge - video.currentTime;
    // Report drift: a small one means server-side latency no seek can cut.
    post('trace', {
      step: 'livesync',
      detail: 'edge=' + liveEdge.toFixed(1) + ' cur=' + video.currentTime.toFixed(1) + ' drift=' + (isFinite(drift) ? drift.toFixed(1) : '?') + 's'
    });
    if (!isFinite(drift) || drift <= TARGET_S) {
      return false;
    }

    try { video.currentTime = liveEdge - TARGET_S; } catch (e) {
      post('trace', { step: 'livesync', detail: 'seek threw' });
      return false;
    }
    post('trace', { step: 'livesync', detail: 'synced to live from drift ' + drift.toFixed(1) + 's' });
    return true;
  };

  // One-shot at start once the stream (not an ad) is playing; user re-triggers later.
  var attempts = 0;
  function syncAtStart() {
    attempts += 1;
    if (!isAdActive()) {
      var video = document.querySelector('video');
      if (video && !video.paused && video.seekable && video.seekable.length > 0) {
        window.__foamSyncToLive();
        return;
      }
    }
    if (attempts < 40) {
      setTimeout(syncAtStart, 2000);
    }
  }
  setTimeout(syncAtStart, 2000);

  return true;
})();
true;`;
}

/**
 * Hides Twitch's own player chrome so foam's custom ControlsOverlay renders
 * over a bare video.
 */
export function buildTwitchChromeHiderScript(): string {
  return `
(function() {
  if (window.__foamChromeHiderInstalled) { return true; }
  window.__foamChromeHiderInstalled = true;

  var HIDE_SELECTORS = [
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
    '[data-a-target*="player-settings"]',
    '[class*="Controls"]',
    '[class*="controls"]',
    'video::-webkit-media-controls',
    'video::-webkit-media-controls-enclosure',
    'video::-webkit-media-controls-panel',
    'video::-webkit-media-controls-play-button',
    'video::-webkit-media-controls-start-playback-button'
  ];

  function installStyle() {
    if (document.getElementById('foam-twitch-control-hide-style')) { return; }
    var style = document.createElement('style');
    style.id = 'foam-twitch-control-hide-style';
    style.textContent = HIDE_SELECTORS.join(',') +
      '{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  var SWEEP_SELECTORS = [
    '.persistent-player',
    '.top-bar',
    '.player-controls',
    '.player-overlay-background',
    '.twilight-player-overlay',
    '#channel-player-disclosures',
    '[data-a-target="player-overlay-click-handler"]',
    '[data-a-target="player-overlay-mature-accept"]',
    '[data-a-target="player-overlay-play-button"]',
    '[data-a-target="player-overlay-preview-background"]',
    '[data-a-target="top-bar"]',
    '[data-a-target*="player-controls"]',
    '[data-a-target*="player-overlay"]',
    '[class*="Controls"]',
    '[class*="controls"]'
  ];

  function hideElements() {
    SWEEP_SELECTORS.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(element) {
        if (element.tagName === 'VIDEO' || element.querySelector('video')) { return; }
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('pointer-events', 'none', 'important');
      });
    });
  }

  installStyle();
  hideElements();

  var queued = false;
  function scheduleHide() {
    if (queued) { return; }
    queued = true;
    setTimeout(function() { queued = false; hideElements(); }, 250);
  }
  var observer = new MutationObserver(scheduleHide);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  return true;
})();
true;`;
}

/**
 * Reports the <video> element's playback state to the bridge (ready/playing/
 * pause) so foam's custom controls know when to appear and reflect play/pause.
 * Without it the bridge stays dormant and the overlay never shows.
 */
export function buildTwitchPlayerStateScript(): string {
  return `
(function() {
  if (window.__foamPlayerStateInstalled) { return true; }
  window.__foamPlayerStateInstalled = true;

  function post(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {}
      }));
    } catch (e) {}
  }

  var readySent = false;
  function sendReady() {
    if (readySent) { return; }
    readySent = true;
    post('ready');
  }

  function attach(video) {
    if (!video || video.__foamStateAttached) { return; }
    video.__foamStateAttached = true;
    if (video.readyState >= 2) { sendReady(); }
    video.addEventListener('loadeddata', sendReady);
    video.addEventListener('canplay', sendReady);
    video.addEventListener('playing', function() { sendReady(); post('playing'); });
    video.addEventListener('play', function() { post('playing'); });
    video.addEventListener('pause', function() { post('pause'); });
    if (!video.paused) { post('playing'); }
  }

  var existing = document.querySelector('video');
  if (existing) {
    attach(existing);
  }
  var observer = new MutationObserver(function() {
    var video = document.querySelector('video');
    if (video && !video.__foamStateAttached) {
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
