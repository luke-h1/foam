/**
 * Seeds the Twitch player's persisted quality choice before its JS boots.
 * Without it the player defaults to auto (often source/1080p60), which is
 * the dominant WebView CPU/bandwidth cost on a phone screen. The player
 * only honors the choice when both `video-quality` (named group) and
 * `quality-bitrate` (ABR cap in bps) are present — verified against
 * player.twitch.tv in Chromium, so this applies to the Android WebView.
 * On iOS it is a no-op: WKWebView gets native HLS where the OS owns
 * rendition selection (the player's quality menu only offers Auto there).
 * Only applies when no quality has been stored yet, so an existing choice
 * wins.
 */
export function buildTwitchPlayerQualityDefaultScript(options: {
  defaultQuality: string;
  maxBitrateBps: number;
}): string {
  return `
(function() {
  try {
    if (!window.localStorage.getItem('video-quality')) {
      window.localStorage.setItem(
        'video-quality',
        JSON.stringify({ default: ${JSON.stringify(options.defaultQuality)} })
      );
      window.localStorage.setItem(
        'quality-bitrate',
        ${JSON.stringify(String(options.maxBitrateBps))}
      );
    }
  } catch (e) {}
})();
true;`;
}
