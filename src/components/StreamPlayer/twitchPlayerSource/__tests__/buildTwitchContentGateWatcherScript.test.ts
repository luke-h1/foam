import { buildTwitchContentGateWatcherScript } from '../buildTwitchContentGateWatcherScript';

describe('buildTwitchContentGateWatcherScript', () => {
  test('content-gate watcher reports a login-required gate so the WebView becomes tappable', () => {
    const script = buildTwitchContentGateWatcherScript();

    expect(script).toContain(
      'var GATE_SELECTOR = \'[data-a-target*="content-classification-gate"]\'',
    );
    /**
     * A gate blocks only when it has no auto-clickable continue button - i.e. it
     * requires login - so the anonymous mature gate (auto-accepted elsewhere) is
     * never reported as blocking.
     */
    expect(script).toContain(
      '!gate.querySelector(\'button[data-a-target*="content-classification-gate"]\')',
    );
    // Posts the bridge message the player uses to re-enable WebView interaction.
    expect(script).toContain("type: 'contentGateDetected'");
    expect(script).toContain('hasContentGate: hasGate');

    // Only posts on a change, so the bridge isn't spammed every tick.
    expect(script).toContain('if (lastReported === hasGate) { return; }');

    /**
     * Stays interactive across the whole login flow: tapping the gate's login
     * link navigates off player.twitch.tv, and the WebView must stay tappable so
     * the user can type/paste credentials.
     */
    expect(script).toContain(
      "window.location.hostname.indexOf('player.twitch.tv') === -1",
    );
    expect(script).toContain('return isInAuthFlow() || isBlockingGate();');
    /**
     * Tapping the login link removes the gate before window.location updates to
     * the auth host, so a synchronous clear would disable the WebView just as the
     * login form appears. Once interactive, the clear is deferred and re-checked
     * so a pending navigation can settle before interaction is handed back.
     */
    expect(script).toContain('if (lastReported === true) {');
    expect(script).toContain('clearTimer = setTimeout(function() {');
    expect(script).toContain('if (!isActive()) { post(false); }');
    // Only the top frame reports, so a login subframe can't race it.
    expect(script).toContain(
      'if (window.top !== window.self) { return true; }',
    );
  });
});
