import { buildTwitchEmbedErrorWatcherScript } from '../buildTwitchEmbedErrorWatcherScript';

describe('buildTwitchEmbedErrorWatcherScript', () => {
  test('embed-error watcher reports Twitch misconfigured pages with the parent value', () => {
    const script = buildTwitchEmbedErrorWatcherScript();

    // Detects Twitch's misconfigured-embed error text.
    expect(script).toContain("text.indexOf('embed is misconfigured') !== -1");
    // Posts the bridge message the native side maps to a dedicated Sentry issue.
    expect(script).toContain("type: 'embedMisconfigured'");
    // Includes the offending parent so the report is actionable.
    expect(script).toContain(
      "new URLSearchParams(window.location.search).get('parent')",
    );
    // Stops as soon as a real player video appears, so it never scans the
    // healthy player's large DOM.
    expect(script).toContain("if (document.querySelector('video'))");
    // Only the top frame reports, so a subframe can't duplicate the event.
    expect(script).toContain(
      'if (window.top !== window.self) { return true; }',
    );
    // The poll is only started when the synchronous check has not already
    // resolved, so a same-tick hit never leaves an unclearable interval.
    expect(script).toContain('if (!stopped) {');
    expect(script).toContain('timer = setInterval(check, 1000)');
  });
});
