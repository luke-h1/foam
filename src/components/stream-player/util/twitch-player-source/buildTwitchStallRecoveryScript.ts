/**
 * Watches the <video> playhead and recovers a silent stall. A frozen Twitch
 * embed keeps `paused === false` and fires no `pause`, `waiting` or `error`
 * event, so without this nothing tells native the picture has stopped. The
 * watchdog polls `currentTime`: a soft nudge (seek to live, resume) first, then
 * a `stalled` message so native can remount the WebView.
 */
export function buildTwitchStallRecoveryScript(options: {
  live: boolean;
}): string {
  return `
(function() {
  if (window.__foamStallRecoveryInstalled) { return true; }
  window.__foamStallRecoveryInstalled = true;

  var POLL_MS = 2000;
  var SOFT_STALL_MS = 6000;
  var HARD_STALL_MS = 14000;
  var HARD_COOLDOWN_MS = 20000;
  var LIVE = ${options.live ? 'true' : 'false'};

  function post(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {}
      }));
    } catch (e) {}
  }

  // Ads play on their own element and advance normally; never treat as a stall.
  function isAdActive() {
    return !!document.querySelector(
      '[data-a-target="video-ad-label"],[data-a-target="video-ad-countdown"],.video-player__ad-info-container,[data-test-selector="ad-banner-default-text-area__content"]'
    );
  }

  var lastTime = null;
  var lastAdvanceAt = Date.now();
  var lastTickAt = Date.now();
  var everAdvanced = false;
  var softTriedAt = 0;
  var hardRequestedAt = 0;

  function softRecover() {
    if (LIVE && typeof window.__foamSyncToLive === 'function') {
      window.__foamSyncToLive();
    }
    if (typeof window.__foamEnsurePlaying === 'function') {
      window.__foamEnsurePlaying();
    }
    var video = document.querySelector('video');
    if (video) {
      try {
        var p = video.play();
        if (p && typeof p.catch === 'function') { p.catch(function() {}); }
      } catch (e) {}
    }
  }

  function tick() {
    var video = document.querySelector('video');
    var now = Date.now();
    var gapMs = now - lastTickAt;
    lastTickAt = now;

    // The timer was suspended (app backgrounded, WebView throttled), so this
    // one tick spans a long wall-clock gap. The playhead did not freeze for
    // that whole gap; treat it as a fresh baseline so a resume does not read as
    // an instant stall and burn a refresh.
    if (gapMs > POLL_MS * 3) {
      lastTime = video ? video.currentTime : null;
      lastAdvanceAt = now;
      return;
    }

    // No element, user/native pause, ended, or an ad break: not a stall.
    if (!video || video.paused || video.ended || isAdActive()) {
      lastTime = video ? video.currentTime : null;
      lastAdvanceAt = now;
      return;
    }

    var time = video.currentTime;
    if (lastTime === null || time !== lastTime) {
      var moved = lastTime !== null && time !== lastTime;
      lastTime = time;
      lastAdvanceAt = now;
      if (moved) {
        everAdvanced = true;
        softTriedAt = 0;
        hardRequestedAt = 0;
      }
      return;
    }

    // The playhead is frozen while the element still thinks it is playing.
    // Ignore a freeze before the first frame ever advanced: that is initial
    // buffering, which the load timeout already covers.
    if (!everAdvanced) { return; }

    var frozenMs = now - lastAdvanceAt;

    if (frozenMs >= HARD_STALL_MS && now - hardRequestedAt >= HARD_COOLDOWN_MS) {
      hardRequestedAt = now;
      post('stalled', { frozenMs: frozenMs });
      return;
    }

    if (frozenMs >= SOFT_STALL_MS && now - softTriedAt >= SOFT_STALL_MS) {
      softTriedAt = now;
      post('trace', {
        step: 'stall',
        detail: 'soft recover after ' + Math.round(frozenMs / 1000) + 's'
      });
      softRecover();
    }
  }

  setInterval(tick, POLL_MS);
  return true;
})();
true;`;
}
