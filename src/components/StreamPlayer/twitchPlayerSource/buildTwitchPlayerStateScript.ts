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
