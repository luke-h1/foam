import { buildTwitchLatencyTrackerScript } from '../buildTwitchLatencyTrackerScript';

describe('buildTwitchLatencyTrackerScript', () => {
  test('latency tracker drives the video-stats menu and reads the latency node', () => {
    const script = buildTwitchLatencyTrackerScript();

    // Navigates Twitch's settings menu: gear -> Advanced -> Video Stats input.
    expect(script).toContain(
      'asyncQuerySelector(\'[data-a-target="player-settings-button"]\', 10000)',
    );
    expect(script).toContain(
      'asyncQuerySelector(\'[data-a-target="player-settings-menu-item-advanced"]\')',
    );
    expect(script).toContain(
      'asyncQuerySelector(\'[data-a-target="player-settings-submenu-advanced-video-stats"] input\')',
    );
    // Reads the latency node and posts it to the bridge.
    expect(script).toContain('[aria-label="Latency To Broadcaster"]');
    expect(script).toContain('hlsLatencyBroadcaster');
    // Keeps Twitch's stats overlay hidden so nothing shows over the video.
    expect(script).toContain('[data-a-target="player-overlay-video-stats"]');
    // The whitespace escape survives into the injected regex as \\s, not s.
    expect(script).toContain('([0-9.]+)\\s*sec');
    // Detects ads so it re-enables stats once the stream resumes.
    expect(script).toContain('function isAdActive()');
    expect(script).toContain('[data-a-target="video-ad-label"]');
  });
});
