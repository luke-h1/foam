import type { EmoteImageVariants } from '@app/types/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants/createEmoteImageVariants';

const bttvCdnUrlPattern =
  /^https:\/\/cdn\.betterttv\.net\/emote\/([^/]+)\/([123])x(?:\.png)?$/;
const ffzCdnUrlPattern =
  /^https:\/\/cdn\.frankerfacez\.com\/emote\/([^/]+)\/(?:(animated)\/)?([124])$/;
const sevenTvCdnUrlPattern =
  /^https:\/\/cdn\.7tv\.app\/emote\/([^/]+)\/([1234])x\.(avif|webp)$/;
const twitchCdnUrlPattern =
  /^https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v2\/([^/]+)\/(?:default|static)\/dark\/[123]\.0$/;

export function deriveEmoteImageVariantsFromUrl(
  url?: string | null,
): EmoteImageVariants | null {
  if (!url) {
    return null;
  }

  const bttvMatch = bttvCdnUrlPattern.exec(url);
  if (bttvMatch?.[1]) {
    const id = bttvMatch[1];
    return createEmoteImageVariants({
      animated: {
        '1x': `https://cdn.betterttv.net/emote/${id}/1x`,
        '2x': `https://cdn.betterttv.net/emote/${id}/2x`,
        '3x': `https://cdn.betterttv.net/emote/${id}/3x`,
      },
      static: {
        '1x': `https://cdn.betterttv.net/emote/${id}/1x.png`,
        '2x': `https://cdn.betterttv.net/emote/${id}/2x.png`,
        '3x': `https://cdn.betterttv.net/emote/${id}/3x.png`,
      },
    });
  }

  const ffzMatch = ffzCdnUrlPattern.exec(url);
  if (ffzMatch?.[1]) {
    const id = ffzMatch[1];
    return createEmoteImageVariants({
      animated: {
        '1x': `https://cdn.frankerfacez.com/emote/${id}/animated/1`,
        '2x': `https://cdn.frankerfacez.com/emote/${id}/animated/2`,
        '4x': `https://cdn.frankerfacez.com/emote/${id}/animated/4`,
      },
      static: {
        '1x': `https://cdn.frankerfacez.com/emote/${id}/1`,
        '2x': `https://cdn.frankerfacez.com/emote/${id}/2`,
        '4x': `https://cdn.frankerfacez.com/emote/${id}/4`,
      },
    });
  }

  const sevenTvMatch = sevenTvCdnUrlPattern.exec(url);
  if (sevenTvMatch?.[1] && sevenTvMatch[3]) {
    const id = sevenTvMatch[1];
    const extension = sevenTvMatch[3];
    return createEmoteImageVariants({
      animated: {
        '1x': `https://cdn.7tv.app/emote/${id}/1x.${extension}`,
        '2x': `https://cdn.7tv.app/emote/${id}/2x.${extension}`,
        '4x': `https://cdn.7tv.app/emote/${id}/4x.${extension}`,
      },
      static: {
        '1x': `https://cdn.7tv.app/emote/${id}/1x_static.${extension}`,
        '2x': `https://cdn.7tv.app/emote/${id}/2x_static.${extension}`,
        '4x': `https://cdn.7tv.app/emote/${id}/4x_static.${extension}`,
      },
    });
  }

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
