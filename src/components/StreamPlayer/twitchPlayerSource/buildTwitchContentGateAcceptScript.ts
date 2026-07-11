/**
 * Auto-accepts Twitch's mature-content classification gate: clicks the
 * "Continue" button as soon as it appears. parent=www.twitch.tv makes Twitch
 * render the anonymous gate rather than a login-required one.
 */
export function buildTwitchContentGateAcceptScript(): string {
  return `
(function() {
  if (window.__foamContentGateAcceptInstalled) { return true; }
  window.__foamContentGateAcceptInstalled = true;

  function asyncQuerySelector(selector, timeout) {
    return new Promise(function(resolve) {
      var el = document.querySelector(selector);
      if (el) { resolve(el); return; }
      var observer = new MutationObserver(function() {
        el = document.querySelector(selector);
        if (el) { observer.disconnect(); resolve(el); }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      if (timeout) {
        setTimeout(function() { observer.disconnect(); resolve(undefined); }, timeout);
      }
    });
  }

  asyncQuerySelector('button[data-a-target*="content-classification-gate"]', 10000)
    .then(function(button) { if (button) { button.click(); } })
    .catch(function() {});
  return true;
})();
true;`;
}
