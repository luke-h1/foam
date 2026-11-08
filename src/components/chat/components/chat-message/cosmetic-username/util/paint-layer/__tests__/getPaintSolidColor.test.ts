import {
  makeLayer,
  makePaint,
} from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';

import { getPaintSolidColor } from '../getPaintSolidColor';

describe('getPaintSolidColor', () => {
  test('prefers the paint solid colour', () => {
    const paint = makePaint({
      color: 0x9c_28_a9_ff,
      layers: {
        0: makeLayer({
          stops: { 0: { at: 0, color: 0x00_ff_00_ff }, length: 1 },
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(156, 40, 169, 1.000)');
  });

  test('falls back to the mid-most stop of a colourless gradient', () => {
    const paint = makePaint({
      layers: {
        0: makeLayer({
          stops: {
            0: { at: 0, color: 0xff_00_00_ff },
            1: { at: 0.6, color: 0x00_ff_00_ff },
            2: { at: 1, color: 0x00_00_ff_ff },
            length: 3,
          },
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(0, 255, 0, 1.000)');
  });

  test('reads the topmost renderable layer, skipping transparent stops', () => {
    const paint = makePaint({
      layers: {
        0: makeLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        }),
        1: makeLayer({
          stops: {
            0: { at: 0.5, color: 0x00_ff_00_00 },
            1: { at: 0.9, color: 0x00_ff_00_ff },
            length: 2,
          },
        }),
        2: makeLayer({
          stops: { 0: { at: 0.5, color: 0x00_00_ff_ff }, length: 1 },
        }),
        length: 3,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(0, 255, 0, 1.000)');
  });

  test('gives no colour for a paint that only carries a texture', () => {
    const paint = makePaint({
      layers: {
        0: makeLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBeNull();
  });

  test('skips a fully transparent paint colour and uses the mid-most opaque stop', () => {
    const paint = makePaint({
      color: 0x9c_28_a9_00,
      layers: {
        0: makeLayer({
          stops: {
            0: { at: 0, color: 0xff_00_00_ff },
            1: { at: 0.5, color: 0x00_ff_00_ff },
            length: 2,
          },
        }),
        length: 1,
      },
    });

    expect(getPaintSolidColor(paint)).toBe('rgba(0, 255, 0, 1.000)');
  });

  test('gives no colour for a transparent paint colour with no stops behind it', () => {
    expect(getPaintSolidColor(makePaint({ color: 0x9c_28_a9_00 }))).toBeNull();
  });
});
