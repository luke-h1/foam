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
