interface TwitchThumbnailSize {
  width: number;
  height: number;
}

export function getTwitchThumbnailUrl(
  template: string,
  { width, height }: TwitchThumbnailSize,
): string {
  return template
    .replace(/%?\{width\}/, String(width))
    .replace(/%?\{height\}/, String(height));
}
