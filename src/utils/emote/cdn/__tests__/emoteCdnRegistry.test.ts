import type {
  EmoteImageScale,
  EmoteImageVariantKind,
  EmoteImageVariants,
} from '@app/types/emote';

import { EMOTE_CDNS, parseEmoteCdnUrl } from '../emoteCdnRegistry';
import { swapSevenTvPaintLayerExt } from '../sevenTv';
import type { EmoteCdnAsset } from '../types';

const KINDS: EmoteImageVariantKind[] = ['animated', 'static'];

describe('emote CDN registry', () => {
  test('pins the real url shape of each provider', () => {
    expect({
      sevenTv: EMOTE_CDNS['7tv'].build({
        id: '01F6MZGCMR000F9PFB2X8E0V0V',
        scale: '4x',
        kind: 'static',
        ext: 'avif',
      }),
      bttv: EMOTE_CDNS.bttv.build({
        id: '5e76d338d6581c3724c0f0b2',
        scale: '3x',
        kind: 'static',
      }),
      ffz: EMOTE_CDNS.ffz.build({
        id: '720507',
        scale: '4x',
        kind: 'animated',
      }),
      twitch: EMOTE_CDNS.twitch.build({
        id: '25',
        scale: '4x',
        kind: 'static',
      }),
    }).toEqual({
      sevenTv:
        'https://cdn.7tv.app/emote/01F6MZGCMR000F9PFB2X8E0V0V/4x_static.avif',
      bttv: 'https://cdn.betterttv.net/emote/5e76d338d6581c3724c0f0b2/3x.png',
      ffz: 'https://cdn.frankerfacez.com/emote/720507/animated/4',
      twitch: 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
    });
  });

  test.each([
    ['7tv', ['1x', '2x', '3x', '4x']],
    ['bttv', ['1x', '2x', '3x']],
    ['ffz', ['1x', '2x', '4x']],
    ['twitch', ['1x', '2x', '4x']],
  ] as const)(
    'round-trips every %s url it builds',
    (provider, scales: readonly EmoteImageScale[]) => {
      const cdn = EMOTE_CDNS[provider];

      for (const scale of scales) {
        for (const kind of KINDS) {
          const url = cdn.build({ id: 'emote-1', scale, kind, ext: 'webp' });
          const parsed = parseEmoteCdnUrl(url);

          expect({
            provider: parsed?.cdn.provider,
            id: parsed?.id,
            scale: parsed?.scale,
            rebuilt: parsed
              ? cdn.build({
                  id: parsed.id,
                  scale: parsed.scale,
                  kind: parsed.kind ?? kind,
                  ext: parsed.ext ?? undefined,
                })
              : null,
          }).toEqual({ provider, id: 'emote-1', scale, rebuilt: url });
        }
      }
    },
  );

  test('reports the kind only when the url form tells it', () => {
    const kindOf = (url: string) => parseEmoteCdnUrl(url)?.kind;

    expect({
      sevenTvAnimated: kindOf(
        EMOTE_CDNS['7tv'].build({ id: 'a', scale: '2x', kind: 'animated' }),
      ),
      sevenTvStatic: kindOf(
        EMOTE_CDNS['7tv'].build({ id: 'a', scale: '2x', kind: 'static' }),
      ),
      bttvBare: kindOf(
        EMOTE_CDNS.bttv.build({ id: 'a', scale: '2x', kind: 'animated' }),
      ),
      ffzBare: kindOf(
        EMOTE_CDNS.ffz.build({ id: 'a', scale: '2x', kind: 'static' }),
      ),
      twitchStatic: kindOf(
        EMOTE_CDNS.twitch.build({ id: 'a', scale: '2x', kind: 'static' }),
      ),
    }).toEqual({
      sevenTvAnimated: 'animated',
      sevenTvStatic: 'static',
      bttvBare: null,
      ffzBare: null,
      twitchStatic: 'static',
    });
  });

  test('builds 7TV variants at all four scales', () => {
    const variants = EMOTE_CDNS['7tv'].buildVariants({
      id: 'a',
      animated: true,
      ext: 'avif',
    });

    expect({
      animated: Object.keys(variants.animated ?? {}),
      static: Object.keys(variants.static ?? {}),
    }).toEqual({
      animated: ['4x', '3x', '2x', '1x'],
      static: ['4x', '3x', '2x', '1x'],
    });
  });

  test('uses the bare url for both sets of a non-animated BTTV or FFZ emote', () => {
    const sameSets = (variants: EmoteImageVariants) =>
      JSON.stringify(variants.animated) === JSON.stringify(variants.static);

    expect({
      bttv: sameSets(
        EMOTE_CDNS.bttv.buildVariants({ id: 'a', animated: false }),
      ),
      bttvAnimated: sameSets(
        EMOTE_CDNS.bttv.buildVariants({ id: 'a', animated: true }),
      ),
      ffz: sameSets(EMOTE_CDNS.ffz.buildVariants({ id: 'a', animated: false })),
      ffzAnimated: sameSets(
        EMOTE_CDNS.ffz.buildVariants({ id: 'a', animated: true }),
      ),
    }).toEqual({
      bttv: true,
      bttvAnimated: false,
      ffz: true,
      ffzAnimated: false,
    });
  });

  test('ignores urls that no provider serves', () => {
    expect([
      parseEmoteCdnUrl('https://example.com/emote/a/4x.webp'),
      parseEmoteCdnUrl('https://cdn.7tv.app/emote/a/4x'),
      parseEmoteCdnUrl('https://cdn.7tv.app/badge/a/4x.webp'),
    ]).toEqual<(EmoteCdnAsset | null)[]>([null, null, null]);
  });

  test('swaps the extension of a 7TV paint layer url only', () => {
    expect([
      swapSevenTvPaintLayerExt(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp?v=2',
        'webp',
        'avif',
      ),
      swapSevenTvPaintLayerExt(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif',
        'webp',
        'avif',
      ),
      swapSevenTvPaintLayerExt('https://example.com/x/4x.webp', 'webp', 'avif'),
    ]).toEqual([
      'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif?v=2',
      'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif',
      'https://example.com/x/4x.webp',
    ]);
  });
});
