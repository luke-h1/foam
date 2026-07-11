import { buildTwitchOverlayHideScript } from '../buildTwitchOverlayHideScript';

describe('buildTwitchOverlayHideScript', () => {
  test('overlay hide targets only the three player-chrome selectors', () => {
    const script = buildTwitchOverlayHideScript();

    expect(script).toContain("document.querySelector('.top-bar')");
    expect(script).toContain("document.querySelector('.player-controls')");
    expect(script).toContain(
      "document.querySelector('#channel-player-disclosures')",
    );
    expect(script).toContain(
      "document.querySelector('.video-player__overlay')",
    );
    // Must not reintroduce subscribe/gift/follow blocking or click interception.
    expect(script).not.toContain('subscribe-button');
    expect(script).not.toContain("addEventListener('click'");
  });
});
