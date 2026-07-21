/**
 * Reports whether a login-required content-classification gate is blocking the
 * player. The anonymous mature gate is auto-dismissed by
 * `buildTwitchContentGateAcceptScript` (it clicks the continue button), but some
 * restricted content forces a "you must log in or create an account to continue"
 * gate that has no continue button - only login/create-account links. On the
 * custom player the WebView is normally non-interactive (foam draws its own
 * controls over it), so those links can't be tapped. Posting
 * `contentGateDetected { hasContentGate: true }` flips the WebView back to
 * interactive so the user can reach them, and `false` once the gate clears.
 */
export function buildTwitchContentGateWatcherScript(): string {
  return `
(function() {
  // Only the top frame drives interaction; a subframe reporting would race it.
  if (window.top !== window.self) { return true; }
  if (window.__foamContentGateWatcherInstalled) { return true; }
  window.__foamContentGateWatcherInstalled = true;

  var GATE_SELECTOR = '[data-a-target*="content-classification-gate"]';
  var lastReported = null;

  function post(hasGate) {
    if (lastReported === hasGate) { return; }
    lastReported = hasGate;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'contentGateDetected',
        payload: { hasContentGate: hasGate }
      }));
    } catch (e) {}
  }

  // The overlay container and its buttons both match GATE_SELECTOR; return the
  // container, which is never itself a <button>.
  function findGate() {
    var candidates = document.querySelectorAll(GATE_SELECTOR);
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].tagName !== 'BUTTON') { return candidates[i]; }
    }
    return null;
  }

  // Blocks only when it has no continue button: the mature gate carries one
  // (auto-clicked by the accept script), the login-required gate does not.
  function isBlockingGate() {
    var gate = findGate();
    if (!gate) { return false; }
    return !gate.querySelector('button[data-a-target*="content-classification-gate"]');
  }

  // Any host other than the player embed means the gate's login link navigated
  // into Twitch's auth flow; keep interaction on until we're back on the embed.
  function isInAuthFlow() {
    try {
      return window.location.hostname.indexOf('player.twitch.tv') === -1;
    } catch (e) {
      return false;
    }
  }

  function isActive() {
    return isInAuthFlow() || isBlockingGate();
  }

  /**
   * Tapping the gate's login link removes the gate from the DOM, which fires the
   * observer's check() a beat before window.location updates to the auth host -
   * so both predicates momentarily read false. Handing interaction straight back
   * then would kill the WebView just as the login form appears. Once we've been
   * interactive, defer any clear so a pending navigation can settle first; if the
   * page is still on the embed with no gate after that, it was a genuine clear.
   */
  var clearTimer = null;

  function check() {
    if (isActive()) {
      if (clearTimer !== null) {
        clearTimeout(clearTimer);
        clearTimer = null;
      }
      post(true);
      return;
    }
    if (lastReported === true) {
      if (clearTimer === null) {
        clearTimer = setTimeout(function() {
          clearTimer = null;
          if (!isActive()) { post(false); }
        }, 600);
      }
      return;
    }
    post(false);
  }

  check();
  var observer = new MutationObserver(check);
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
  setInterval(check, 1000);
  return true;
})();
true;`;
}
