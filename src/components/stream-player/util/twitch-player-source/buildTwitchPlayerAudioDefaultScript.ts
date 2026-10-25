/**
 * Seeds the embed's persisted `video-muted` before its JS boots: the app owns
 * mute state via `initialMuted`, so it must win over what Twitch last stored.
 */
export function buildTwitchPlayerAudioDefaultScript(options: {
  muted: boolean;
}): string {
  return `
(function() {
  try {
    window.localStorage.setItem(
      'video-muted',
      JSON.stringify({ default: ${options.muted ? 'true' : 'false'} })
    );
    window.localStorage.setItem('volume', '1');
  } catch (e) {}
})();
true;`;
}
