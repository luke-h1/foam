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

  // Android plays the embed through MSE, where a live seekable range ends at a
  // 2^30 sentinel rather than the live edge. Only the buffered range names a
  // position the element can actually play, so it caps the seek.
  function getLiveEdge(video) {
    var buffered = video.buffered;
    if (!buffered || buffered.length === 0) {
      return NaN;
    }
    var seekable = video.seekable;
    var seekableEnd = seekable && seekable.length > 0
      ? seekable.end(seekable.length - 1)
      : Infinity;
    return Math.min(seekableEnd, buffered.end(buffered.length - 1));
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

    var liveEdge = getLiveEdge(video);
    if (!isFinite(liveEdge)) {
      post('trace', { step: 'livesync', detail: 'no live edge' });
      return false;
    }

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
      if (video && !video.paused && isFinite(getLiveEdge(video))) {
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
