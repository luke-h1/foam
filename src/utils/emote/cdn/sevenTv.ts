import type { EmoteImageScale, EmoteImageVariantSet } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emote-image-variants/createEmoteImageVariants';

import type { EmoteCdn, EmoteCdnAsset, EmoteCdnUrlOptions } from './types';

const SEVEN_TV_FILE_URL =
  /^(?<base>.+\/)(?<scale>[1-4])x(?<staticSuffix>_static)?\.(?<ext>avif|webp|png|gif)(?<query>\?.*)?$/i;

const SEVEN_TV_EMOTE_BASE = /^https:\/\/cdn\.7tv\.app\/emote\/([^/]+)\/$/;

const SEVEN_TV_PAINT_BASE = /^https:\/\/cdn\.7tv\.app\/paint\//;

const SEVEN_TV_SCALES = ['1x', '2x', '3x', '4x'] as const;

export interface SevenTvFileUrl {
  base: string;
  scale: EmoteImageScale;
  isStatic: boolean;
  ext: string;
  query: string;
}

export function parseSevenTvFileUrl(url: string): SevenTvFileUrl | null {
  const groups = SEVEN_TV_FILE_URL.exec(url)?.groups;

  if (!groups?.['base'] || !groups['scale'] || !groups['ext']) {
    return null;
  }

  return {
    base: groups['base'],
    // SAFETY: the pattern only matches a scale digit of 1-4.
    scale: `${groups['scale']}x` as EmoteImageScale,
    isStatic: Boolean(groups['staticSuffix']),
    ext: groups['ext'].toLowerCase(),
    query: groups['query'] ?? '',
  };
}

export function buildSevenTvFileUrl({
  base,
  scale,
  isStatic,
  ext,
  query,
}: SevenTvFileUrl): string {
  return `${base}${scale}${isStatic ? '_static' : ''}.${ext}${query}`;
}

export function swapSevenTvPaintLayerExt(
  url: string,
  from: string,
  to: string,
): string {
  const file = parseSevenTvFileUrl(url);

  if (!file || file.ext !== from || !SEVEN_TV_PAINT_BASE.test(file.base)) {
    return url;
  }

  return buildSevenTvFileUrl({ ...file, ext: to });
}

function parse(url: string): EmoteCdnAsset | null {
  const file = parseSevenTvFileUrl(url);

  if (!file || file.query) {
    return null;
  }

  const id = SEVEN_TV_EMOTE_BASE.exec(file.base)?.[1];

  if (!id) {
    return null;
  }

  return {
    id,
    scale: file.scale,
    kind: file.isStatic ? 'static' : 'animated',
    ext: file.ext,
  };
}

export function sevenTvEmotePageUrl(id: string): string {
  'worklet';

  return `https://7tv.app/emotes/${id}`;
}

export function buildSevenTvBadgeUrl(badgeId: string): string {
  return buildSevenTvFileUrl({
    base: `https://cdn.7tv.app/badge/${badgeId}/`,
    scale: '4x',
    isStatic: false,
    ext: 'webp',
    query: '',
  });
}

function build({ id, scale, kind, ext = 'webp' }: EmoteCdnUrlOptions): string {
  return buildSevenTvFileUrl({
    base: `https://cdn.7tv.app/emote/${id}/`,
    scale,
    isStatic: kind === 'static',
    ext,
    query: '',
  });
}

export const sevenTvEmoteCdn: EmoteCdn = {
  provider: '7tv',
  parse,
  build,
  pageUrl: sevenTvEmotePageUrl,
  buildVariants: ({ id, ext }) => {
    const animated: EmoteImageVariantSet = {};
    const staticSet: EmoteImageVariantSet = {};

    for (const scale of SEVEN_TV_SCALES) {
      animated[scale] = build({ id, scale, kind: 'animated', ext });
      staticSet[scale] = build({ id, scale, kind: 'static', ext });
    }

    return createEmoteImageVariants({ animated, static: staticSet });
  },
};
