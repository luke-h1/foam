const params = new URLSearchParams(window.location.search);
const channel = params.get('channel') || 'twitch';
const video = params.get('video') || '';
const autoplay = params.get('autoplay') !== 'false';
const muted = params.get('muted') !== 'false';
const debug = params.get('debug') === 'true' || params.get('debug') === '1';
const debugUi =
  params.get('debugUi') === 'true' || params.get('debugUi') === '1';
const playerUrlStorageKey = 'foam-player:last-url';

const statsPanel = document.getElementById('stats');
const latencyEl = document.getElementById('latency');
const bufferEl = document.getElementById('buffer');
const resolutionEl = document.getElementById('resolution');
const eventsEl = document.getElementById('events');
const events = [];
const MAX_REASONABLE_LIVE_LATENCY_SECONDS = 600;

if (debugUi) {
  statsPanel.hidden = false;
  document.documentElement.dataset.debugUi = 'true';
}

try {
  window.sessionStorage.setItem(
    playerUrlStorageKey,
    `${window.location.pathname}${window.location.search}`,
  );
} catch {}

window.open = url => {
  if (typeof url === 'string' && url.length > 0) {
    window.location.assign(url);
  }
  return window;
};

function post(type, payload = {}) {
  if (type === 'trace' && !debug) {
    return;
  }

  const message = { type, payload };
  try {
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  } catch {}

  if (debug || debugUi) {
    console.log('[foam-player]', message);
  }
}

function recordEvent(event) {
  events.push(event);
  eventsEl.textContent = events.slice(-4).join(' -> ');
  post('trace', { step: 'player_event', detail: event });
}

function formatSeconds(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(1)}s`
    : 'n/a';
}

function normalizeLiveLatency(value) {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value < MAX_REASONABLE_LIVE_LATENCY_SECONDS
    ? value
    : null;
}

function updateVisibleStats(stats) {
  if (!debugUi || !stats) {
    return;
  }

  latencyEl.textContent = formatSeconds(
    normalizeLiveLatency(stats.hlsLatencyBroadcaster),
  );
  bufferEl.textContent = formatSeconds(stats.bufferSize);
  resolutionEl.textContent =
    stats.videoResolution || stats.displayResolution || 'n/a';
}

function createPlayer() {
  post('trace', { step: 'creating_player', detail: video || channel });

  let iframeAttributeObserver = null;
  let playerElementObserver = null;
  let interactionFallbackTimer = null;
  let interactionRequired = false;
  let hasUsablePlayback = false;
  let isPlaying = false;

  function setInteractionRequired(required, reason) {
    if (interactionRequired === required) {
      return;
    }

    interactionRequired = required;
    recordEvent(required ? `interaction:${reason}` : 'interaction-cleared');
    post('contentGateDetected', { hasContentGate: required });
  }

  function scheduleInteractionFallback(reason) {
    window.clearTimeout(interactionFallbackTimer);
    interactionFallbackTimer = window.setTimeout(() => {
      if (!hasUsablePlayback) {
        setInteractionRequired(true, reason);
      }
    }, 2500);
  }

  function allowIframeScrolling() {
    const iframe = document.querySelector('#player iframe');
    if (!iframe) {
      return null;
    }

    if (iframe.getAttribute('scrolling') !== 'yes') {
      iframe.setAttribute('scrolling', 'yes');
    }
    if (iframe.style.overflow !== 'auto') {
      iframe.style.setProperty('overflow', 'auto', 'important');
    }
    if (iframe.style.webkitOverflowScrolling !== 'touch') {
      iframe.style.webkitOverflowScrolling = 'touch';
    }
    if (iframe.style.touchAction !== 'auto') {
      iframe.style.touchAction = 'auto';
    }

    return iframe;
  }

  function installIframeScrolling() {
    const apply = () => {
      const iframe = allowIframeScrolling();
      if (!iframe || iframeAttributeObserver?.target === iframe) {
        return;
      }

      iframeAttributeObserver?.disconnect();
      iframeAttributeObserver = new MutationObserver(() => {
        allowIframeScrolling();
      });
      iframeAttributeObserver.target = iframe;
      iframeAttributeObserver.observe(iframe, {
        attributeFilter: ['scrolling', 'style', 'class'],
        attributes: true,
      });
    };

    apply();

    playerElementObserver?.disconnect();
    playerElementObserver = new MutationObserver(() => {
      apply();
    });
    const playerElement = document.getElementById('player');
    if (!playerElement) {
      return;
    }

    playerElementObserver.observe(playerElement, {
      childList: true,
      subtree: true,
    });

    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      apply();
      if (attempts >= 120) {
        window.clearInterval(retry);
      }
    }, 250);
  }

  installIframeScrolling();
  scheduleInteractionFallback('startup');

  const options = {
    autoplay,
    height: '100%',
    muted,
    parent: [window.location.hostname],
    width: '100%',
  };

  if (video) {
    options.video = video;
  } else {
    options.channel = channel;
  }

  const player = new Twitch.Player('player', options);
  window._twitchPlayer = player;

  function emitMuteState() {
    post('muteState', {
      muted: player.getMuted(),
      volume: player.getVolume(),
    });
  }

  function disableCaptions() {
    try {
      if (typeof player.disableCaptions === 'function') {
        player.disableCaptions();
      }
    } catch {}
  }

  function emitPlaybackStats() {
    const stats =
      typeof player.getPlaybackStats === 'function'
        ? player.getPlaybackStats()
        : null;
    if (!stats) {
      return;
    }

    updateVisibleStats(stats);
    const hasVideoResolution = Boolean(stats.videoResolution);
    const hlsLatencyBroadcaster = normalizeLiveLatency(
      stats.hlsLatencyBroadcaster,
    );
    if (
      isPlaying &&
      hasVideoResolution &&
      hlsLatencyBroadcaster !== null &&
      hlsLatencyBroadcaster > 0.25
    ) {
      hasUsablePlayback = true;
      setInteractionRequired(false);
    }

    if (
      typeof stats.hlsLatencyBroadcaster === 'number' &&
      hlsLatencyBroadcaster === null &&
      !hasUsablePlayback
    ) {
      setInteractionRequired(true, 'invalid-latency');
    }

    post('playbackStats', {
      bufferSize: stats.bufferSize,
      displayResolution: stats.displayResolution,
      fps: stats.fps,
      hlsLatencyBroadcaster,
      playbackRate: stats.playbackRate,
      skippedFrames: stats.skippedFrames,
      videoResolution: stats.videoResolution,
    });
  }

  let playbackStatsInterval = null;
  function startPlaybackStats() {
    emitPlaybackStats();
    if (playbackStatsInterval) {
      return;
    }
    playbackStatsInterval = setInterval(emitPlaybackStats, 1000);
  }

  function stopPlaybackStats() {
    if (!playbackStatsInterval) {
      return;
    }
    clearInterval(playbackStatsInterval);
    playbackStatsInterval = null;
  }

  let pendingPauseTimer = null;
  let lastBlockedEventAt = 0;
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
    } catch {}
    post('pause');
  }

  function postPlaybackBlocked() {
    const now = Date.now();
    if (now - lastBlockedEventAt < 2000) {
      return;
    }
    lastBlockedEventAt = now;
    recordEvent('blocked');
    setInteractionRequired(true, 'blocked');
    post('playbackBlocked');
  }

  player.addEventListener(Twitch.Player.READY, () => {
    recordEvent('ready');
    allowIframeScrolling();
    disableCaptions();
    scheduleInteractionFallback('ready');
    post('ready');
    emitMuteState();
    startPlaybackStats();
  });

  player.addEventListener(Twitch.Player.PLAY, () => {
    clearPendingPause();
    recordEvent('play');
    post('play');
  });

  player.addEventListener(Twitch.Player.PAUSE, () => {
    recordEvent('pause');
    clearPendingPause();
    pendingPauseTimer = setTimeout(postPauseIfStillPaused, 750);
  });

  player.addEventListener(Twitch.Player.PLAYBACK_BLOCKED, () => {
    postPlaybackBlocked();
  });

  player.addEventListener(Twitch.Player.CAPTIONS, () => {
    disableCaptions();
  });

  player.addEventListener(Twitch.Player.PLAYING, () => {
    isPlaying = true;
    window.clearTimeout(interactionFallbackTimer);
    clearPendingPause();
    allowIframeScrolling();
    disableCaptions();
    recordEvent('playing');
    post('playing');
    post('stateUpdate', {
      isBuffering: false,
      isPaused: false,
      isReady: true,
      muted: player.getMuted(),
      volume: player.getVolume(),
    });
    startPlaybackStats();
  });

  player.addEventListener(Twitch.Player.ENDED, () => {
    stopPlaybackStats();
    post('ended');
  });
  player.addEventListener(Twitch.Player.OFFLINE, () => post('offline'));
  player.addEventListener(Twitch.Player.ONLINE, () => post('online'));

  window.playerControls = {
    getCurrentTime: () =>
      post('currentTime', { time: player.getCurrentTime() }),
    getDuration: () => post('duration', { duration: player.getDuration() }),
    mute: () => {
      player.setMuted(true);
      emitMuteState();
    },
    pause: () => player.pause(),
    play: () => player.play(),
    seek: timestamp => player.seek(timestamp),
    seekToLive: () => {},
    setChannel: nextChannel => player.setChannel(nextChannel),
    setMuted: nextMuted => {
      player.setMuted(nextMuted);
      emitMuteState();
    },
    setQuality: quality => player.setQuality(quality),
    setVideo: (nextVideo, timestamp = 0) =>
      player.setVideo(nextVideo, timestamp),
    setVolume: volume => {
      player.setVolume(volume);
      if (volume > 0) {
        player.setMuted(false);
      }
      emitMuteState();
    },
    unmute: () => {
      player.setMuted(false);
      player.setVolume(1);
      emitMuteState();
    },
  };

}

if (window.Twitch?.Player) {
  createPlayer();
} else {
  post('error', { message: 'Twitch player script did not load' });
}
