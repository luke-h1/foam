const TWITCH_PLAYER_ALLOWED_NAVIGATION_PREFIXES = [
  'about:blank',
  'https://id.twitch.tv/',
  'https://www.twitch.tv/passport-callback',
  'https://clips.twitch.tv/',
  'https://player.twitch.tv/',
];

export function isAllowedTwitchPlayerNavigation(
  url: string,
  parent: string,
): boolean {
  if (!url) {
    return false;
  }

  const normalizedParent = parent.trim().toLowerCase();
  const parentBaseUrl = normalizedParent
    ? `https://${normalizedParent}/`
    : null;

  return (
    TWITCH_PLAYER_ALLOWED_NAVIGATION_PREFIXES.some(prefix =>
      url.startsWith(prefix),
    ) ||
    (parentBaseUrl != null && url.startsWith(parentBaseUrl))
  );
}

export function buildRawTwitchPlayerUrl(options: {
  autoplay: boolean;
  channel: string;
  muted: boolean;
  parent: string;
  video?: string;
}): string {
  const params = new URLSearchParams();

  if (options.video) {
    params.set('video', options.video);
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

export function buildRawTwitchPlayerBootstrapScript(options: {
  autoplay: boolean;
  debug: boolean;
  muted: boolean;
}): string {
  return `
(function() {
  if (window.__foamRawTwitchPlayerBootstrapped) {
    return true;
  }
  window.__foamRawTwitchPlayerBootstrapped = true;
  var shouldAutoplay = ${options.autoplay ? 'true' : 'false'};
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

  function postPlaybackBlocked() {
    var now = Date.now();
    if (now - lastBlockedEventAt < 2000) {
      return;
    }
    lastBlockedEventAt = now;
    post('playbackBlocked');
  }

  function clearPlaybackRecoveryTimers() {
    playbackRecoveryTimers.forEach(function(timer) {
      clearTimeout(timer);
    });
    playbackRecoveryTimers = [];
  }

  function playVideo(video) {
    if (!video) {
      return;
    }

    prepareInlineVideo(video);
    video.muted = targetMuted;
    if (!targetMuted) {
      video.volume = 1;
    }
    var result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(postPlaybackBlocked);
    }
  }

  function schedulePlaybackRecovery() {
    if (!shouldAutoplay || userPaused) {
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
      try {
        if (video.textTracks && video.textTracks[0]) {
          video.textTracks[0].mode = 'hidden';
        }
      } catch (e) {}
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
      try {
        if (video.textTracks && video.textTracks[0]) {
          video.textTracks[0].mode = 'hidden';
        }
      } catch (e) {}
      schedulePlaybackRecovery();
      pendingPauseTimer = setTimeout(function() {
        postPauseIfStillPaused(video);
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
      playVideo(video);
      schedulePlaybackRecovery();
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
  asyncQuerySelector('video', 10000).then(installVideoBridge).catch(function() {});
  window.addEventListener('resize', schedulePlaybackRecovery);
  window.addEventListener('orientationchange', schedulePlaybackRecovery);
  window.addEventListener('pageshow', schedulePlaybackRecovery);
  document.addEventListener('visibilitychange', schedulePlaybackRecovery);
  post('trace', { step: 'raw_player_bootstrap_installed' });
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
