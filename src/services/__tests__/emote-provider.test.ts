import { buildSanitisedEmote } from '../emote-provider';

describe('buildSanitisedEmote', () => {
  test('assembles the sanitised contract and picks the highest available scale', () => {
    const result = buildSanitisedEmote({
      id: 'emote1',
      name: 'catJAM',
      site: 'BTTV',
      creator: 'someUser',
      emoteLink: 'https://provider.example/emotes/emote1',
      originalName: 'catJAMOriginal',
      animated: {
        '2x': 'https://cdn.example/emote1/animated/2x',
        '3x': 'https://cdn.example/emote1/animated/3x',
      },
      static: {
        '2x': 'https://cdn.example/emote1/static/2x',
        '3x': 'https://cdn.example/emote1/static/3x',
      },
    });

    expect(result).toEqual({
      id: 'emote1',
      name: 'catJAM',
      url: 'https://cdn.example/emote1/animated/3x',
      static_url: 'https://cdn.example/emote1/static/3x',
      image_variants: {
        animated: {
          '2x': 'https://cdn.example/emote1/animated/2x',
          '3x': 'https://cdn.example/emote1/animated/3x',
        },
        static: {
          '2x': 'https://cdn.example/emote1/static/2x',
          '3x': 'https://cdn.example/emote1/static/3x',
        },
      },
      emote_link: 'https://provider.example/emotes/emote1',
      original_name: 'catJAMOriginal',
      creator: 'someUser',
      site: 'BTTV',
    });
  });

  test('defaults original_name to UNKNOWN when the provider supplies none', () => {
    const result = buildSanitisedEmote({
      id: '128054',
      name: 'OMEGALUL',
      site: 'Global FFZ',
      creator: null,
      emoteLink: 'https://www.frankerfacez.com/emoticon/128054',
      animated: {
        '4x': 'https://cdn.example/128054/animated/4',
      },
      static: {
        '4x': 'https://cdn.example/128054/static/4',
      },
    });

    expect(result).toEqual({
      id: '128054',
      name: 'OMEGALUL',
      url: 'https://cdn.example/128054/animated/4',
      static_url: 'https://cdn.example/128054/static/4',
      image_variants: {
        animated: {
          '4x': 'https://cdn.example/128054/animated/4',
        },
        static: {
          '4x': 'https://cdn.example/128054/static/4',
        },
      },
      emote_link: 'https://www.frankerfacez.com/emoticon/128054',
      original_name: 'UNKNOWN',
      creator: null,
      site: 'Global FFZ',
    });
  });

  test('falls back to the static set for url when no animated variants exist', () => {
    const result = buildSanitisedEmote({
      id: 'emote2',
      name: 'StaticOnly',
      site: 'FFZ',
      creator: 'owner',
      emoteLink: 'https://provider.example/emotes/emote2',
      animated: {},
      static: {
        '2x': 'https://cdn.example/emote2/static/2x',
        '4x': 'https://cdn.example/emote2/static/4x',
      },
    });

    expect(result).toEqual({
      id: 'emote2',
      name: 'StaticOnly',
      url: 'https://cdn.example/emote2/static/4x',
      static_url: 'https://cdn.example/emote2/static/4x',
      image_variants: {
        static: {
          '2x': 'https://cdn.example/emote2/static/2x',
          '4x': 'https://cdn.example/emote2/static/4x',
        },
      },
      emote_link: 'https://provider.example/emotes/emote2',
      original_name: 'UNKNOWN',
      creator: 'owner',
      site: 'FFZ',
    });
  });

  test('drops empty variant urls when compacting image_variants', () => {
    const result = buildSanitisedEmote({
      id: 'emote3',
      name: 'Sparse',
      site: 'Twitch Global',
      creator: null,
      emoteLink: 'https://provider.example/emotes/emote3',
      originalName: 'Sparse',
      animated: {
        '2x': '',
        '4x': 'https://cdn.example/emote3/animated/4x',
      },
      static: {
        '2x': 'https://cdn.example/emote3/static/2x',
        '4x': '',
      },
    });

    expect(result).toEqual({
      id: 'emote3',
      name: 'Sparse',
      url: 'https://cdn.example/emote3/animated/4x',
      static_url: 'https://cdn.example/emote3/static/2x',
      image_variants: {
        animated: {
          '4x': 'https://cdn.example/emote3/animated/4x',
        },
        static: {
          '2x': 'https://cdn.example/emote3/static/2x',
        },
      },
      emote_link: 'https://provider.example/emotes/emote3',
      original_name: 'Sparse',
      creator: null,
      site: 'Twitch Global',
    });
  });
});
