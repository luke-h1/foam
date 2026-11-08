import type { EmoteImageVariantSet } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emote-image-variants/createEmoteImageVariants';

import { createScaleSlugs } from './scaleSlugs';
import type { EmoteCdn, EmoteCdnAsset, EmoteCdnUrlOptions } from './types';

const TWITCH_URL =
  /^https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v2\/([^/]+)\/(default|static)\/dark\/([123]\.0)$/;

/**
 * Twitch serves three sizes. Its largest, `3.0`, is the 4x image.
 */
const TWITCH_SCALES = createScaleSlugs(
  { '1x': '1.0', '2x': '2.0', '4x': '3.0' },
  '4x',
);

const TWITCH_VARIANT_SCALES = ['2x', '4x'] as const;

function parse(url: string): EmoteCdnAsset | null {
  const match = TWITCH_URL.exec(url);
  const scale = TWITCH_SCALES.fromSlug(match?.[3]);

  if (!match?.[1] || !scale) {
    return null;
  }

  return {
    id: match[1],
    scale,
    kind: match[2] === 'static' ? 'static' : 'animated',
    ext: null,
  };
}

function build({ id, scale, kind }: EmoteCdnUrlOptions): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/${kind === 'static' ? 'static' : 'default'}/dark/${TWITCH_SCALES.toSlug(scale)}`;
}

export const twitchEmoteCdn: EmoteCdn = {
  provider: 'twitch',
  parse,
  build,
  pageUrl: id => build({ id, scale: '4x', kind: 'animated' }),
  buildVariants: ({ id }) => {
    const animated: EmoteImageVariantSet = {};
    const staticSet: EmoteImageVariantSet = {};

    for (const scale of TWITCH_VARIANT_SCALES) {
      animated[scale] = build({ id, scale, kind: 'animated' });
      staticSet[scale] = build({ id, scale, kind: 'static' });
    }

    return createEmoteImageVariants({ animated, static: staticSet });
  },
};
