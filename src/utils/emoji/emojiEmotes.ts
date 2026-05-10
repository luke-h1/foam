import emojiData from 'emojibase-data/en/data.json';
import emojibaseLegacyShortcodes from 'emojibase-data/en/shortcodes/emojibase-legacy.json';
import emojibaseShortcodes from 'emojibase-data/en/shortcodes/emojibase.json';
import githubShortcodes from 'emojibase-data/en/shortcodes/github.json';

import type { SanitisedEmote } from '@app/types/emote';

export type EmojiStyle = 'twitter' | 'google';

type EmojiRecord = {
  hexcode: string;
};

type ShortcodeMap = Record<string, string | string[]>;

const EMOJI_CDN_BY_STYLE: Record<EmojiStyle, (hexcode: string) => string> = {
  twitter: hexcode =>
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${hexcode.toLowerCase()}.png`,
  google: hexcode =>
    `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72/emoji_u${hexcode.toLowerCase()}.png`,
};

export const EMOJI_STYLE_OPTIONS: Array<{
  label: string;
  value: EmojiStyle;
}> = [
  { label: 'Twitter', value: 'twitter' },
  { label: 'Google', value: 'google' },
];

function toArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getEmojiAliases(hexcode: string): string[] {
  const deduped = new Set<string>();
  const sources: ShortcodeMap[] = [
    githubShortcodes,
    emojibaseShortcodes,
    emojibaseLegacyShortcodes,
  ];

  for (const source of sources) {
    for (const alias of toArray(source[hexcode])) {
      const trimmed = alias.trim().toLowerCase();
      if (trimmed) {
        deduped.add(trimmed);
      }
    }
  }

  return Array.from(deduped);
}

function createEmojiEmote(
  hexcode: string,
  alias: string,
  style: EmojiStyle,
): SanitisedEmote {
  const shortcode = `:${alias}:`;
  const url = EMOJI_CDN_BY_STYLE[style](hexcode);

  return {
    id: hexcode,
    name: shortcode,
    original_name: shortcode,
    creator: null,
    emote_link: '',
    url,
    static_url: url,
    site: 'Emoji',
    width: 72,
    height: 72,
    aspect_ratio: 1,
    zero_width: false,
  };
}

const emojiEmoteCache = new Map<EmojiStyle, SanitisedEmote[]>();

export function getEmojiEmotes(style: EmojiStyle): SanitisedEmote[] {
  const cached = emojiEmoteCache.get(style);
  if (cached) {
    return cached;
  }

  const emotes = (emojiData as EmojiRecord[]).flatMap(entry => {
    const aliases = getEmojiAliases(entry.hexcode);

    if (aliases.length === 0) {
      return [];
    }

    return aliases.map(alias => createEmojiEmote(entry.hexcode, alias, style));
  });

  emojiEmoteCache.set(style, emotes);
  return emotes;
}
