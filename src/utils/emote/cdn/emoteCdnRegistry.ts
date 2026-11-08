import { bttvEmoteCdn } from './bttv';
import { ffzEmoteCdn } from './ffz';
import { sevenTvEmoteCdn } from './sevenTv';
import { twitchEmoteCdn } from './twitch';
import type { EmoteCdn, EmoteCdnAsset, EmoteCdnProvider } from './types';

export const EMOTE_CDNS = {
  '7tv': sevenTvEmoteCdn,
  bttv: bttvEmoteCdn,
  ffz: ffzEmoteCdn,
  twitch: twitchEmoteCdn,
} satisfies Record<EmoteCdnProvider, EmoteCdn>;

const EMOTE_CDN_LIST: EmoteCdn[] = Object.values(EMOTE_CDNS);

export interface ParsedEmoteCdnUrl extends EmoteCdnAsset {
  cdn: EmoteCdn;
}

export function parseEmoteCdnUrl(url: string): ParsedEmoteCdnUrl | null {
  for (const cdn of EMOTE_CDN_LIST) {
    const asset = cdn.parse(url);

    if (asset) {
      return { ...asset, cdn };
    }
  }

  return null;
}
