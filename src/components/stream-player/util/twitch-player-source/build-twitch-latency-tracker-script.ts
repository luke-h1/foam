/**
 * Drives Twitch's hidden Video Stats overlay to read broadcaster latency and
 * posts it to the bridge as `playbackStats { hlsLatencyBroadcaster }`.
 */
export function buildTwitchLatencyTrackerScript(): string {
  return `
(function() {
  if (window.__foamLatencyTrackerInstalled) { return true; }
  window.__foamLatencyTrackerInstalled = true;

  var LATENCY_NODE = '[aria-label="Latency To Broadcaster"]';
  var STATS_OVERLAY_HIDE_ID = 'foam-stats-overlay-hide';
  var SETTINGS_MENU_HIDE_ID = 'foam-settings-menu-hide';

  function post(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {}
      }));
    } catch (e) {}
  }

  function ensureStyle(id, css) {
    if (document.getElementById(id)) { return; }
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle(id) {
    var existing = document.getElementById(id);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  // Ads tear down the latency node — skip while one is playing.
  function isAdActive() {
    return !!document.querySelector(
      '[data-a-target="video-ad-label"],[data-a-target="video-ad-countdown"],.video-player__ad-info-container,[data-test-selector="ad-banner-default-text-area__content"]'
    );
  }

  // Keep the stats overlay hidden for the session.
  ensureStyle(
    STATS_OVERLAY_HIDE_ID,
    '[data-a-target="player-overlay-video-stats"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
  );

  function asyncQuerySelector(selector, timeout) {
    return new Promise(function(resolve) {
      var existing = document.querySelector(selector);
      if (existing) { resolve(existing); return; }
      var timeoutId;
      var observer = new MutationObserver(function() {
        var element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(element);
        }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      timeoutId = setTimeout(function() {
        observer.disconnect();
        resolve(undefined);
      }, timeout || 8000);
    });
  }

  var enableInFlight = false;
  var enableAttempts = 0;
  var hadLatencyNode = false;

  async function enableVideoStats() {
    if (enableInFlight) { return; }
    enableInFlight = true;
    // Hide the settings menu only while we drive it; safety timer always restores it.
    ensureStyle(
      SETTINGS_MENU_HIDE_ID,
      '[data-a-target="player-settings-menu"]{display:none!important;visibility:hidden!important;opacity:0!important;}'
    );
    var safety = setTimeout(function() { removeStyle(SETTINGS_MENU_HIDE_ID); }, 6000);
    try {
      var settingsButton = await asyncQuerySelector('[data-a-target="player-settings-button"]', 10000);
      if (!settingsButton) { return; }
      settingsButton.click();

      var advancedItem = await asyncQuerySelector('[data-a-target="player-settings-menu-item-advanced"]');
      if (!advancedItem) { settingsButton.click(); return; }
      advancedItem.click();

      var statsCheckbox = await asyncQuerySelector('[data-a-target="player-settings-submenu-advanced-video-stats"] input');
      if (statsCheckbox && !statsCheckbox.checked) { statsCheckbox.click(); }

      settingsButton.click();
      post('trace', { step: 'latency', detail: 'enable attempt ' + enableAttempts + (statsCheckbox ? ' toggled' : ' no-checkbox') });
    } catch (e) {
    } finally {
      clearTimeout(safety);
      // Let the close click unmount the menu before revealing it.
      setTimeout(function() {
        removeStyle(SETTINGS_MENU_HIDE_ID);
        enableInFlight = false;
      }, 350);
    }
  }

  var lastPosted = undefined;
  function readLatency() {
    var element = document.querySelector(LATENCY_NODE);
    var text = element && element.textContent ? element.textContent.trim() : '';
    var match = text.match(/([0-9.]+)\\s*sec/i);
    var next = null;
    if (match) {
      var parsed = Number.parseFloat(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) { next = parsed; }
    }
    if (next === null) {
      if (text) { post('trace', { step: 'latency', detail: 'unparsed "' + text + '"' }); }
      return;
    }
    if (
      lastPosted === next ||
      (typeof lastPosted === 'number' && Math.abs(lastPosted - next) < 0.25)
    ) {
      return;
    }
    lastPosted = next;
    post('playbackStats', {
      bufferSize: null,
      displayResolution: null,
      fps: null,
      hlsLatencyBroadcaster: next,
      playbackRate: null,
      skippedFrames: null,
      videoResolution: null
    });
  }

  function tick() {
    if (isAdActive()) {
      // Refresh the enable budget so stats re-enable after the ad.
      enableAttempts = 0;
      hadLatencyNode = false;
      return;
    }
    if (!document.querySelector(LATENCY_NODE)) {
      // Lost a node we had (ad/reset): refresh the budget.
      if (hadLatencyNode) {
        hadLatencyNode = false;
        enableAttempts = 0;
      }
      if (enableAttempts < 12 && !enableInFlight) {
        enableAttempts += 1;
        enableVideoStats();
      }
      return;
    }
    hadLatencyNode = true;
    enableAttempts = 0;
    readLatency();
  }

  function start() {
    tick();
    setInterval(tick, 4000);
  }

  if (document.querySelector('video')) {
    start();
  } else {
    var boot = new MutationObserver(function() {
      if (document.querySelector('video')) {
        boot.disconnect();
        start();
      }
    });
    boot.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
    setTimeout(function() { boot.disconnect(); start(); }, 10000);
  }

  return true;
})();
true;`;
}
