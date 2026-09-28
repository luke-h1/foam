interface BuildStreamSourceKeyOptions {
  autoplay: boolean;
  channel: string | undefined;
  clip: string | undefined;
  deferOverlayUntilUserUnmute: boolean;
  embedParent: string;
  initialMuted: boolean;
  video: string | undefined;
}

/**
 * Identifies one embed source. Any change here means the WebView must reload,
 * so every value the embed URL is built from belongs in it.
 */
export function buildStreamSourceKey({
  autoplay,
  channel,
  clip,
  deferOverlayUntilUserUnmute,
  embedParent,
  initialMuted,
  video,
}: BuildStreamSourceKeyOptions) {
  return `${channel ?? ''}|${clip ?? ''}|${video ?? ''}|${embedParent}|${autoplay}|${initialMuted}|${deferOverlayUntilUserUnmute}`;
}
