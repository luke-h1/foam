import { buildTwitchCaptionHiderScript } from '../buildTwitchCaptionHiderScript';

describe('buildTwitchCaptionHiderScript', () => {
  test('caption hider switches the text track to hidden on play and pause', () => {
    const script = buildTwitchCaptionHiderScript();

    expect(script).toContain("video.textTracks[0].mode = 'hidden'");
    expect(script).not.toContain("mode = 'disabled'");
    expect(script).not.toContain('text-track-container');
    expect(script).toContain("video.addEventListener('playing'");
    expect(script).toContain("video.addEventListener('pause'");
  });
});
