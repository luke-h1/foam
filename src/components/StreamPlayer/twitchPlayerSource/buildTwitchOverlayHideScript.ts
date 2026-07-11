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
