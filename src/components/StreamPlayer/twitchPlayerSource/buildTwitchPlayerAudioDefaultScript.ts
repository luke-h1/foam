/**
 * Seeds the Twitch player's persisted mute/volume choice before its JS boots,
 * mirroring the quality seed above. WKWebView keeps localStorage across
 * sessions, and Twitch's embed restores `video-muted` from it (ignoring the
 * `muted=false` URL param) — so once a muted-autoplay run has stored
 * `video-muted: true`, every later open boots muted, and the after-load ensure
 * script then fights WebKit's policy (unmuting a muted autoplay can re-pause
 * it), leaving the stream paused/muted. Writing the desired state up front lets
 * the player autoplay in that state cleanly (autoplay is permitted because the
 * WebView sets mediaPlaybackRequiresUserAction=false). Forced, not conditional:
 * the app owns the mute state via `initialMuted`, so it must win over whatever
 * Twitch last stored.
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
