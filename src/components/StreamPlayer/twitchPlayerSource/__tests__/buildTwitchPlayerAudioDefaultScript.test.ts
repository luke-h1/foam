import { buildTwitchPlayerAudioDefaultScript } from '../buildTwitchPlayerAudioDefaultScript';

describe('buildTwitchPlayerAudioDefaultScript', () => {
  test('seeds the Twitch player mute preference so it boots in the requested audio state', () => {
    const unmuted = buildTwitchPlayerAudioDefaultScript({ muted: false });
    expect(unmuted).toContain(
      "window.localStorage.setItem(\n      'video-muted',\n      JSON.stringify({ default: false })\n    )",
    );
    expect(unmuted).toContain("window.localStorage.setItem('volume', '1')");

    const muted = buildTwitchPlayerAudioDefaultScript({ muted: true });
    expect(muted).toContain('JSON.stringify({ default: true })');
    expect(muted).toContain("window.localStorage.setItem('volume', '1')");
  });
});
