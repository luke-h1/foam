import type {
  EmoteImageScale,
  EmoteImageVariantKind,
  EmoteImageVariants,
} from '@app/types/emote';

/**
 * Fallback order per requested scale. 2x is the floor - 1x is never
 * selected, and an emote whose host only ships 1x renders via fallbackUrl.
 */
const scaleScanOrders: Record<EmoteImageScale, EmoteImageScale[]> = {
  '1x': ['2x', '3x', '4x'],
  '2x': ['2x', '3x', '4x'],
  '3x': ['3x', '4x', '2x'],
  '4x': ['4x', '3x', '2x'],
};

export function pickEmoteVariantUrl({
  fallbackUrl,
  imageVariants,
  preferredKind,
  preferredScale = '4x',
}: {
  fallbackUrl?: string | null;
  imageVariants?: EmoteImageVariants | null;
  preferredKind: EmoteImageVariantKind;
  preferredScale?: EmoteImageScale;
}): string {
  const scanOrder = scaleScanOrders[preferredScale];
  const preferredSet = imageVariants?.[preferredKind];

  for (const scale of scanOrder) {
    const url = preferredSet?.[scale];
    if (url) {
      return url;
    }
  }

  const alternateKind: EmoteImageVariantKind =
    preferredKind === 'static' ? 'animated' : 'static';
  const alternateSet = imageVariants?.[alternateKind];

  for (const scale of scanOrder) {
    const url = alternateSet?.[scale];
    if (url) {
      return url;
    }
  }

  return fallbackUrl ?? '';
}
