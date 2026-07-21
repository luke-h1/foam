import type { TwitchSanitisedEmote } from '@app/types/emote';

import { extractEmotesFromTag } from '../extractEmotesFromTag';

describe('extractEmotes', () => {
  test('applies emote positions by code point when the message has surrogate pairs', () => {
    /**
     * Twitch indexes the emotes tag by Unicode code point, not UTF-16 unit.
     * "😀" (U+1F600) is one code point but two UTF-16 units, so "Kappa" sits at
     * code points 2-6 while a naive UTF-16 slice(2, 7) would yield " Kapp".
     */
    const result = extractEmotesFromTag('25:2-6', '😀 Kappa');

    expect(result).toEqual<TwitchSanitisedEmote[]>([
      {
        id: '25',
        name: 'Kappa',
        original_name: 'Kappa',
        creator: 'Unknown',
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
        image_variants: {
          animated: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
          },
          static: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
          },
        },
        site: 'Twitch Subscriber',
      },
    ]);
  });

  test('extracts Twitch tagged subscriber emotes as renderable emotes', () => {
    const result = extractEmotesFromTag('emotesv2_sub:6-12', 'hello SubHype');

    expect(result).toEqual<TwitchSanitisedEmote[]>([
      {
        id: 'emotesv2_sub',
        name: 'SubHype',
        original_name: 'SubHype',
        creator: 'Unknown',
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/3.0',
        image_variants: {
          animated: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/default/dark/3.0',
          },
          static: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_sub/static/dark/3.0',
          },
        },
        site: 'Twitch Subscriber',
      },
    ]);
  });
});
