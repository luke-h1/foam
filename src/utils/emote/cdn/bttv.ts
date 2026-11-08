import type { EmoteImageScale, EmoteImageVariantSet } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emote-image-variants/createEmoteImageVariants';

import type { EmoteCdn, EmoteCdnAsset, EmoteCdnUrlOptions } from './types';

const BTTV_URL =
  /^https:\/\/cdn\.betterttv\.net\/emote\/([^/]+)\/([123])x(\.png)?$/;

const BTTV_SCALES = ['1x', '2x', '3x'] as const;

function parse(url: string): EmoteCdnAsset | null {
  const match = BTTV_URL.exec(url);

  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    id: match[1],
    // SAFETY: the pattern only matches a scale digit of 1-3.
    scale: `${match[2]}x` as EmoteImageScale,
    // The bare url does not say whether the emote is animated. Only the
    // `.png` form is always static.
    kind: match[3] ? 'static' : null,
    ext: match[3] ? 'png' : null,
  };
}

function build({ id, scale, kind }: EmoteCdnUrlOptions): string {
  return `https://cdn.betterttv.net/emote/${id}/${scale}${kind === 'static' ? '.png' : ''}`;
}

export const bttvEmoteCdn: EmoteCdn = {
  provider: 'bttv',
  parse,
  build,
  pageUrl: id => `https://betterttv.com/emotes/${id}`,
  buildVariants: ({ id, animated }) => {
    const animatedSet: EmoteImageVariantSet = {};
    const staticSet: EmoteImageVariantSet = {};

    // An unknown emote keeps a `.png` static set, so "disable animations"
    // still has a still frame to show for an animated emote.
    const staticKind = animated === false ? 'animated' : 'static';

    for (const scale of BTTV_SCALES) {
      animatedSet[scale] = build({ id, scale, kind: 'animated' });
      staticSet[scale] = build({ id, scale, kind: staticKind });
    }

    return createEmoteImageVariants({
      animated: animatedSet,
      static: staticSet,
    });
  },
};
