/**
 * Seeds the Twitch player's persisted quality choice before its JS boots; the
 * player only honors it with both `video-quality` and `quality-bitrate` set.
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
