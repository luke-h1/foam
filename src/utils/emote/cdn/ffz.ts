import type { EmoteImageVariantSet } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emote-image-variants/createEmoteImageVariants';

import { createScaleSlugs } from './scaleSlugs';
import type { EmoteCdn, EmoteCdnAsset, EmoteCdnUrlOptions } from './types';

const FFZ_URL =
  /^https:\/\/cdn\.frankerfacez\.com\/emote\/([^/]+)\/(animated\/)?([124])$/;

const FFZ_SCALES = createScaleSlugs({ '1x': '1', '2x': '2', '4x': '4' }, '4x');

function parse(url: string): EmoteCdnAsset | null {
  const match = FFZ_URL.exec(url);
  const scale = FFZ_SCALES.fromSlug(match?.[3]);

  if (!match?.[1] || !scale) {
    return null;
  }

  return {
    id: match[1],
    scale,
    // A bare scale url may still serve animated WebP. Leave the kind unknown
    // so useAppleWebpCodec never routes animated WebP to ImageIO (fatal hang).
    kind: match[2] ? 'animated' : null,
    ext: null,
  };
}

function build({ id, scale, kind }: EmoteCdnUrlOptions): string {
  return `https://cdn.frankerfacez.com/emote/${id}/${kind === 'animated' ? 'animated/' : ''}${FFZ_SCALES.toSlug(scale)}`;
}

export const ffzEmoteCdn: EmoteCdn = {
  provider: 'ffz',
  parse,
  build,
  pageUrl: id => `https://www.frankerfacez.com/emoticon/${id}`,
  buildVariants: ({ id, animated }) => {
    const animatedSet: EmoteImageVariantSet = {};
    const staticSet: EmoteImageVariantSet = {};

    // FFZ serves `animated/{n}` only for animated emotes. For any other emote
    // that path 404s, so both sets use the bare url.
    const animatedKind = animated === true ? 'animated' : 'static';

    for (const scale of FFZ_SCALES.scales) {
      animatedSet[scale] = build({ id, scale, kind: animatedKind });
      staticSet[scale] = build({ id, scale, kind: 'static' });
    }

    return createEmoteImageVariants({
      animated: animatedSet,
      static: staticSet,
    });
  },
};
