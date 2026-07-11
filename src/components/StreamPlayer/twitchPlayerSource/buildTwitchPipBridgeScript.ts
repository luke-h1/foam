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
