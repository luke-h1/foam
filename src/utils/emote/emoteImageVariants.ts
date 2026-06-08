import type {
  EmoteImageScale,
  EmoteImageVariantKind,
  EmoteImageVariants,
  SanitisedEmote,
} from '@app/types/emote';

const preferredScales: EmoteImageScale[] = ['4x', '3x', '2x', '1x'];

const bttvCdnUrlPattern =
  /^https:\/\/cdn\.betterttv\.net\/emote\/([^/]+)\/([123])x(?:\.png)?$/;

const ffzCdnUrlPattern =
  /^https:\/\/cdn\.frankerfacez\.com\/emote\/([^/]+)\/(?:(animated)\/)?([124])$/;

const sevenTvCdnUrlPattern =
  /^https:\/\/cdn\.7tv\.app\/emote\/([^/]+)\/([1234])x\.(avif|webp)$/;

const twitchCdnUrlPattern =
  /^https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v2\/([^/]+)\/(?:default|static)\/dark\/[123]\.0$/;

const resolvedVariantCache = new WeakMap<SanitisedEmote, SanitisedEmote>();

export function createEmoteImageVariants({
  animated,
  static: staticVariants,
}: {
  animated?: EmoteImageVariants['animated'];
  static?: EmoteImageVariants['static'];
}): EmoteImageVariants {
  const resolvedAnimated = compactVariantSet(animated);
  const resolvedStatic = compactVariantSet(staticVariants);

  return {
    ...(resolvedAnimated ? { animated: resolvedAnimated } : null),
    ...(resolvedStatic ? { static: resolvedStatic } : null),
  };
}

function compactVariantSet(
  variants: EmoteImageVariants['animated'],
): EmoteImageVariants['animated'] | undefined {
  if (!variants) {
    return undefined;
  }

  const compacted = preferredScales.reduce<
    NonNullable<EmoteImageVariants['animated']>
  >((result, scale) => {
    const url = variants[scale];
    if (url) {
      result[scale] = url;
    }
    return result;
  }, {});

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

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
  const preferredSet = imageVariants?.[preferredKind];
  const preferredUrl = preferredSet?.[preferredScale];

  if (preferredUrl) {
    return preferredUrl;
  }

  for (const scale of preferredScales) {
    const url = preferredSet?.[scale];
    if (url) {
      return url;
    }
  }

  const alternateKind: EmoteImageVariantKind =
    preferredKind === 'static' ? 'animated' : 'static';
  const alternateSet = imageVariants?.[alternateKind];

  for (const scale of preferredScales) {
    const url = alternateSet?.[scale];
    if (url) {
      return url;
    }
  }

  return fallbackUrl ?? '';
}

export function getEmoteImageVariantUrls(emote: SanitisedEmote): string[] {
  const urls = new Set(getEmoteImageCacheUrls(emote));

  Object.values(emote.image_variants?.animated ?? {}).forEach(url => {
    addUrl(urls, url);
  });
  Object.values(emote.image_variants?.static ?? {}).forEach(url => {
    addUrl(urls, url);
  });

  return Array.from(urls);
}

export function getEmoteImageCacheUrls(emote: SanitisedEmote): string[] {
  const urls = new Set<string>();
  addUrl(urls, emote.url);
  addUrl(urls, emote.static_url);

  return Array.from(urls);
}

function addUrl(urls: Set<string>, url?: string | null): void {
  if (url) {
    urls.add(url);
  }
}

export function withResolvedEmoteImageVariants<T extends SanitisedEmote>(
  emote: T,
): T {
  if (emote.image_variants?.animated || emote.image_variants?.static) {
    return emote;
  }

  const cached = resolvedVariantCache.get(emote);
  if (cached) {
    return cached as T;
  }

  const imageVariants = deriveEmoteImageVariantsFromUrl(emote.url);
  if (!imageVariants) {
    return emote;
  }

  const staticUrl =
    emote.static_url ??
    pickEmoteVariantUrl({
      fallbackUrl: emote.url,
      imageVariants,
      preferredKind: 'static',
    });

  const resolvedEmote = {
    ...emote,
    static_url: staticUrl,
    image_variants: imageVariants,
  };
  resolvedVariantCache.set(emote, resolvedEmote);
  return resolvedEmote;
}

export function deriveEmoteImageVariantsFromUrl(
  url?: string | null,
): EmoteImageVariants | null {
  if (!url) {
    return null;
  }

  /**
   * BTTV
   */
  const bttvMatch = bttvCdnUrlPattern.exec(url);

  if (bttvMatch?.[1]) {
    const id = bttvMatch[1];
    return createEmoteImageVariants({
      animated: {
        '2x': `https://cdn.betterttv.net/emote/${id}/2x`,
        '3x': `https://cdn.betterttv.net/emote/${id}/3x`,
      },
      static: {
        '2x': `https://cdn.betterttv.net/emote/${id}/2x.png`,
        '3x': `https://cdn.betterttv.net/emote/${id}/3x.png`,
      },
    });
  }

  /**
   * FFZ
   */
  const ffzMatch = ffzCdnUrlPattern.exec(url);

  if (ffzMatch?.[1]) {
    const id = ffzMatch[1];
    return createEmoteImageVariants({
      animated: {
        '2x': `https://cdn.frankerfacez.com/emote/${id}/animated/2`,
        '4x': `https://cdn.frankerfacez.com/emote/${id}/animated/4`,
      },
      static: {
        '2x': `https://cdn.frankerfacez.com/emote/${id}/2`,
        '4x': `https://cdn.frankerfacez.com/emote/${id}/4`,
      },
    });
  }

  /**
   * Seven TV
   */
  const sevenTvMatch = sevenTvCdnUrlPattern.exec(url);

  if (sevenTvMatch?.[1] && sevenTvMatch[3]) {
    const id = sevenTvMatch[1];
    const extension = sevenTvMatch[3];
    return createEmoteImageVariants({
      animated: {
        '2x': `https://cdn.7tv.app/emote/${id}/2x.${extension}`,
        '4x': `https://cdn.7tv.app/emote/${id}/4x.${extension}`,
      },
      static: {
        '2x': `https://cdn.7tv.app/emote/${id}/2x_static.${extension}`,
        '4x': `https://cdn.7tv.app/emote/${id}/4x_static.${extension}`,
      },
    });
  }

  /**
   * Twitch
   */
  const twitchMatch = twitchCdnUrlPattern.exec(url);
  if (twitchMatch?.[1]) {
    const id = twitchMatch[1];
    return createEmoteImageVariants({
      animated: {
        '2x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
        '4x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
      },
      static: {
        '2x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/2.0`,
        '4x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/3.0`,
      },
    });
  }

  return null;
}
