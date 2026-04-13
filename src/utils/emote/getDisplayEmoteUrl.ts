/* eslint-disable camelcase */
export function getDisplayEmoteUrl({
  url,
  static_url,
  disableAnimations = false,
}: {
  url?: string | null;
  static_url?: string | null;
  disableAnimations?: boolean;
}) {
  if (disableAnimations && static_url) {
    return static_url;
  }

  return url ?? '';
}
