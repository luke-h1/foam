/**
 * Detects Twitch's "Whoops, this embed is misconfigured" error page and posts
 * an `embedMisconfigured` bridge message so the native side can surface it to
 * Sentry with the offending `parent` value. Twitch serves this as a bare error
 * document (no player `<video>`) when the embed `parent` is empty or is not an
 * allowed domain; without this watcher the failure only shows up as a generic
 * load timeout. Polls briefly at load and stops as soon as a real player
 * `<video>` appears, so the healthy player's large DOM is never scanned.
 */
export function buildTwitchEmbedErrorWatcherScript(): string {
  return `
(function() {
  // Only the top frame owns the embed URL; a subframe reporting would duplicate.
  if (window.top !== window.self) { return true; }
  if (window.__foamEmbedErrorWatcherInstalled) { return true; }
  window.__foamEmbedErrorWatcherInstalled = true;

  var checks = 0;
  var timer = null;
  var stopped = false;

  function stop() {
    stopped = true;
    if (timer) { clearInterval(timer); timer = null; }
  }

  function readParent() {
    try {
      return new URLSearchParams(window.location.search).get('parent');
    } catch (e) {
      return null;
    }
  }

  function check() {
    if (stopped) { return; }
    checks += 1;
    // A real player <video> means the embed loaded; nothing to watch for.
    if (document.querySelector('video')) {
      stop();
      return;
    }
    var text = (document.body && document.body.textContent || '').toLowerCase();
    if (text.indexOf('embed is misconfigured') !== -1) {
      stop();
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'embedMisconfigured',
          payload: {
            message: 'Whoops, this embed is misconfigured',
            parent: readParent()
          }
        }));
      } catch (e) {}
      return;
    }
    // The error appears at load; give up after ~15s so this never lingers.
    if (checks >= 15) { stop(); }
  }

  // Poll only if the synchronous check did not already resolve, so a same-tick
  // hit (error/video/timeout) never leaves an interval running unclearable.
  check();
  if (!stopped) {
    timer = setInterval(check, 1000);
  }
  return true;
})();
true;`;
}
