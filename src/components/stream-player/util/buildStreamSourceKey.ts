interface BuildStreamSourceKeyOptions {
  autoplay: boolean;
  channel: string | undefined;
  clip: string | undefined;
  deferOverlayUntilUserUnmute: boolean;
  embedParent: string;
  initialMuted: boolean;
  video: string | undefined;
}

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
