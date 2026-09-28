/**
 * Hides Twitch's own player chrome so foam's custom ControlsOverlay renders
 * over a bare video.
 */
export function buildTwitchChromeHiderScript(): string {
  return `
(function() {
  if (window.__foamChromeHiderInstalled) { return true; }
  window.__foamChromeHiderInstalled = true;

  var HIDE_SELECTORS = [
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
    '[data-a-target*="player-settings"]',
    '[class*="Controls"]',
    '[class*="controls"]',
    'video::-webkit-media-controls',
    'video::-webkit-media-controls-enclosure',
    'video::-webkit-media-controls-panel',
    'video::-webkit-media-controls-play-button',
    'video::-webkit-media-controls-start-playback-button'
  ];

  function installStyle() {
    if (document.getElementById('foam-twitch-control-hide-style')) { return; }
    var style = document.createElement('style');
    style.id = 'foam-twitch-control-hide-style';
    style.textContent = HIDE_SELECTORS.join(',') +
      '{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  var SWEEP_SELECTORS = [
    '.persistent-player',
    '.top-bar',
    '.player-controls',
    '.player-overlay-background',
    '.twilight-player-overlay',
    '#channel-player-disclosures',
    '[data-a-target="player-overlay-click-handler"]',
    '[data-a-target="player-overlay-mature-accept"]',
    '[data-a-target="player-overlay-play-button"]',
    '[data-a-target="player-overlay-preview-background"]',
    '[data-a-target="top-bar"]',
    '[data-a-target*="player-controls"]',
    '[data-a-target*="player-overlay"]',
    '[class*="Controls"]',
    '[class*="controls"]'
  ];

  function hideElements() {
    SWEEP_SELECTORS.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(element) {
        if (element.tagName === 'VIDEO' || element.querySelector('video')) { return; }
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('pointer-events', 'none', 'important');
      });
    });
  }

  installStyle();
  hideElements();

  var queued = false;
  function scheduleHide() {
    if (queued) { return; }
    queued = true;
    setTimeout(function() { queued = false; hideElements(); }, 250);
  }
  var observer = new MutationObserver(scheduleHide);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  return true;
})();
true;`;
}
