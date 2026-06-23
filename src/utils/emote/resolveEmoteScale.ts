import type { EmoteImageScale } from '@app/types/emote';

export function isSevenTvEmoteSite(site?: string | null): boolean {
  return site?.startsWith('7TV') ?? false;
}

/**
 * Picks the source scale a chat-inline emote should render/warm at. 2x is the
 * baseline for ~30pt inline emotes; 1x is used on low-RAM devices, and — when
 * the experimental flag is on — for 7TV emotes specifically (their animated
 * AVIFs dominate decode CPU and frame memory). The rendered box is sized from
 * the emote's aspect ratio regardless, so a 1x source just upscales rather than
 * distorting.
 */
export function resolveEmotePreferredScale(options: {
  isSevenTv: boolean;
  sevenTvLowRes: boolean;
  isLowEnd?: boolean;
}): EmoteImageScale {
  if (options.isLowEnd) {
    return '1x';
  }
  if (options.isSevenTv && options.sevenTvLowRes) {
    return '1x';
  }
  return '2x';
}
