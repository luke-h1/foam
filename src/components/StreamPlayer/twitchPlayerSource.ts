export const TWITCH_PLAYER_WEBSITE_URL = (
  process.env.EXPO_PUBLIC_TWITCH_PLAYER_WEBSITE_URL ??
  process.env.EXPO_PUBLIC_PLAYER_URL
)?.trim();

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
  playerWebsiteUrl?: string,
): boolean {
  if (!url) {
    return false;
  }

  const normalizedParent = parent.trim().toLowerCase();
  const parentBaseUrl = normalizedParent
    ? `https://${normalizedParent}/`
    : null;
  const playerWebsiteBaseUrl = playerWebsiteUrl
    ? getBaseUrl(playerWebsiteUrl)
    : null;

  return (
    TWITCH_PLAYER_ALLOWED_NAVIGATION_PREFIXES.some(prefix =>
      url.startsWith(prefix),
    ) ||
    (parentBaseUrl != null && url.startsWith(parentBaseUrl)) ||
    (playerWebsiteBaseUrl != null && url.startsWith(playerWebsiteBaseUrl))
  );
}

function getBaseUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/`;
  } catch {
    return null;
  }
}

export function buildHostedTwitchPlayerUrl(options: {
  autoplay: boolean;
  channel: string;
  debug: boolean;
  muted: boolean;
  playerWebsiteUrl?: string;
  video?: string;
}): string | null {
  if (!options.playerWebsiteUrl) {
    return null;
  }

  try {
    const url = new URL(options.playerWebsiteUrl);
    url.searchParams.set('autoplay', options.autoplay ? 'true' : 'false');
    url.searchParams.set('muted', options.muted ? 'true' : 'false');
    url.searchParams.set('debug', options.debug ? 'true' : 'false');

    if (options.video) {
      url.searchParams.set('video', options.video);
      url.searchParams.delete('channel');
    } else {
      url.searchParams.set('channel', options.channel);
      url.searchParams.delete('video');
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function buildTwitchEmbedHtml(options: {
  channel: string;
  video?: string;
  parent: string;
  autoplay: boolean;
  muted: boolean;
  debug: boolean;
  width: number | string;
  height: number | string;
}): string {
  const { channel, video, parent, autoplay, muted, debug, width, height } =
    options;
  const safeChannel = channel.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const safeParent = parent.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const widthPx = typeof width === 'number' ? `${width}px` : width;
  const heightPx = typeof height === 'number' ? `${height}px` : height;

  // Prevent Twitch's native overlay from rendering above Foam's controls.
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="dns-prefetch" href="//embed.twitch.tv">
  <link rel="preconnect" href="https://embed.twitch.tv" crossorigin>
  <link rel="preconnect" href="https://static.twitchcdn.net" crossorigin>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      min-height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      background: #000;
    }
    #twitch-player { width: 100%; height: 100%; }
    .player-controls,
    #channel-player-disclosures,
    [data-a-target="player-overlay-preview-background"],
    [data-a-target="player-overlay-video-stats"],
    [data-a-target="player-overlay-play-button"],
    [data-a-target="player-overlay-click-handler"],
    .player-overlay-background {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  </style>
</head>
<body>
  <div id="twitch-player" style="width:${widthPx};height:${heightPx};"></div>
  <script>
    var enableTrace = ${debug ? 'true' : 'false'};
    var initialMuted = ${muted ? 'true' : 'false'};
    function post(type, payload) {
      if (type === 'trace' && !enableTrace) {
        return;
      }
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
      } catch (e) {}
    }
    post('trace', { step: 'html_parsed', detail: 'inline script running' });
    function initPlayer() {
      post('trace', { step: 'embed_script_loaded', detail: 'Twitch embed v1.js loaded' });
      try {
        if (typeof Twitch === 'undefined') {
          post('error', { message: 'Twitch is undefined after script load' });
          return;
        }
        post('trace', { step: 'creating_player', detail: 'channel=${safeChannel}' });
        var embedOpts = {
          width: '100%',
          height: '100%',
          parent: ['${safeParent}'],
          autoplay: ${autoplay},
          muted: ${muted}
        };
        ${video ? `embedOpts.video = '${video.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';` : `embedOpts.channel = '${safeChannel}';`}
        var player = new Twitch.Player('twitch-player', embedOpts);
        post('trace', { step: 'player_created', detail: 'Twitch.Player instance created' });
        window._twitchPlayer = player;
        function emitMuteState() {
          post('muteState', {
            muted: player.getMuted(),
            volume: player.getVolume()
          });
        }
        function disableCaptions() {
          try {
            if (typeof player.disableCaptions === 'function') {
              player.disableCaptions();
            }
          } catch (e) {}
        }
        function emitPlaybackStats() {
          try {
            if (typeof player.getPlaybackStats !== 'function') {
              return;
            }
            var stats = player.getPlaybackStats();
            if (!stats) {
              return;
            }
            post('playbackStats', {
              bufferSize: stats.bufferSize,
              displayResolution: stats.displayResolution,
              fps: stats.fps,
              hlsLatencyBroadcaster:
                typeof stats.hlsLatencyBroadcaster === 'number'
                  ? stats.hlsLatencyBroadcaster
                  : null,
              playbackRate: stats.playbackRate,
              skippedFrames: stats.skippedFrames,
              videoResolution: stats.videoResolution
            });
          } catch (e) {}
        }
        var playbackStatsInterval = null;
        var isPlayerVisible = !document.hidden;
        var isPlayerPlaying = false;
        var lastBlockedEventAt = 0;
        function startPlaybackStats() {
          if (!isPlayerVisible || !isPlayerPlaying) {
            return;
          }
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
        function updatePlaybackStatsLifecycle() {
          if (isPlayerVisible && isPlayerPlaying) {
            startPlaybackStats();
            return;
          }
          stopPlaybackStats();
        }
        document.addEventListener('visibilitychange', function() {
          isPlayerVisible = !document.hidden;
          updatePlaybackStatsLifecycle();
        });
        player.addEventListener(Twitch.Player.READY, function() {
          disableCaptions();
          post('ready');
          emitMuteState();
          startPlaybackStats();
          if (!initialMuted && player.getMuted()) {
            var unmuteDeadline = Date.now() + 5000;
            var unmuteTick = setInterval(function() {
              var el = null;
              try {
                var nodes = document.querySelectorAll('button, a, [role=button], [class*="unmute"], [class*="Unmute"]');
                for (var i = 0; i < nodes.length; i++) {
                  var t = (nodes[i].textContent || '').toLowerCase();
                  if (t.indexOf('click to unmute') !== -1) { el = nodes[i]; break; }
                }
              } catch (e) {}
              if (el) {
                clearInterval(unmuteTick);
                el.click();
                player.setMuted(false);
                player.setVolume(1);
              } else if (Date.now() > unmuteDeadline) {
                clearInterval(unmuteTick);
                player.setMuted(false);
                player.setVolume(1);
              }
            }, 100);
          }
        });
        var pendingPauseTimer = null;
        function clearPendingPause() {
          if (!pendingPauseTimer) {
            return;
          }
          clearTimeout(pendingPauseTimer);
          pendingPauseTimer = null;
        }
        function postPauseIfStillPaused() {
          pendingPauseTimer = null;
          try {
            if (typeof player.isPaused === 'function' && !player.isPaused()) {
              return;
            }
          } catch (e) {}
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
        player.addEventListener(Twitch.Player.PLAY, function() {
          clearPendingPause();
          isPlayerPlaying = true;
          updatePlaybackStatsLifecycle();
          post('play');
        });
        player.addEventListener(Twitch.Player.PAUSE, function() {
          clearPendingPause();
          isPlayerPlaying = false;
          updatePlaybackStatsLifecycle();
          pendingPauseTimer = setTimeout(postPauseIfStillPaused, 750);
        });
        player.addEventListener(Twitch.Player.PLAYBACK_BLOCKED, function() {
          postPlaybackBlocked();
        });
        player.addEventListener(Twitch.Player.CAPTIONS, function() {
          disableCaptions();
        });
        player.addEventListener(Twitch.Player.PLAYING, function() {
          clearPendingPause();
          disableCaptions();
          isPlayerPlaying = true;
          updatePlaybackStatsLifecycle();
          post('playing');
          post('stateUpdate', {
            isBuffering: false,
            isPaused: false,
            isReady: true,
            muted: player.getMuted(),
            volume: player.getVolume()
          });
        });
        player.addEventListener(Twitch.Player.ENDED, function() {
          isPlayerPlaying = false;
          stopPlaybackStats();
          post('ended');
        });
        player.addEventListener(Twitch.Player.OFFLINE, function() { post('offline'); });
        player.addEventListener(Twitch.Player.ONLINE, function() { post('online'); });
        window.playerControls = {
          play: function() { player.play(); },
          pause: function() { player.pause(); },
          mute: function() { player.setMuted(true); emitMuteState(); },
          setMuted: function(m) { player.setMuted(m); emitMuteState(); },
          unmute: function() { player.setMuted(false); player.setVolume(1); emitMuteState(); },
          setVolume: function(v) { player.setVolume(v); if (v > 0) { player.setMuted(false); } emitMuteState(); },
          getCurrentTime: function() { post('currentTime', { time: player.getCurrentTime() }); },
          getDuration: function() { post('duration', { duration: player.getDuration() }); },
          seek: function(t) { player.seek(t); },
          setChannel: function(c) { player.setChannel(c); },
          setVideo: function(v, t) { player.setVideo(v, t || 0); },
          setQuality: function(q) { player.setQuality(q); },
          seekToLive: function() {}
        };
        post('trace', { step: 'player_ready', detail: 'listeners and controls attached' });
      } catch (e) {
        post('error', { message: 'initPlayer: ' + (e.message || String(e)) });
      }
    }
    var embedScript = document.createElement('script');
    embedScript.src = 'https://embed.twitch.tv/embed/v1.js';
    embedScript.onload = function() { initPlayer(); };
    embedScript.onerror = function() {
      post('error', { message: 'Failed to load embed.twitch.tv/embed/v1.js' });
    };
    post('trace', { step: 'loading_embed_script', detail: 'fetching v1.js' });
    document.head.appendChild(embedScript);
    setTimeout(function() {
      if (!window._twitchPlayer && !window.__traceInitTimeout) {
        window.__traceInitTimeout = true;
        post('trace', { step: 'timeout_10s', detail: 'Twitch player not ready after 10s' });
      }
    }, 10000);
  </script>
</body>
</html>`;
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

export function buildRawTwitchPlayerBootstrapScript(options: {
  autoplay: boolean;
  debug: boolean;
}): string {
  return `
(function() {
  if (window.__foamRawTwitchPlayerBootstrapped) {
    return true;
  }
  window.__foamRawTwitchPlayerBootstrapped = true;
  var shouldAutoplay = ${options.autoplay ? 'true' : 'false'};
  var enableTrace = ${options.debug ? 'true' : 'false'};
  var hideAttempts = 0;
  var playbackStatsInterval = null;
  var pendingPauseTimer = null;
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
      '.top-bar',
      '.player-controls',
      '#channel-player-disclosures',
      '[data-a-target="player-overlay-video-stats"]',
      '[data-a-target="player-overlay-play-button"]',
      '[data-a-target="player-overlay-click-handler"]',
      '[data-a-target="player-overlay-preview-background"]',
      '.player-overlay-background'
    ];

    selectors.forEach(function(selector) {
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

  function installVideoBridge(video) {
    if (!video || video.__foamBridgeInstalled) {
      return;
    }

    video.__foamBridgeInstalled = true;
    prepareInlineVideo(video);
    video.muted = false;
    video.volume = 1;
    post('ready');
    emitMuteState(video);

    video.addEventListener('playing', function() {
      clearPendingPause();
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
      clearPendingPause();
      stopPlaybackStats();
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
      var playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(postPlaybackBlocked);
      }
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
  }

  installOverlayHider();
  installPlayerControls();
  acceptContentWarning();
  asyncQuerySelector('video', 10000).then(installVideoBridge).catch(function() {});
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
