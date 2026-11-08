import { makeLayer } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';

import { isRenderablePaintLayer } from '../isRenderablePaintLayer';

const TWO_STOPS = {
  0: { at: 0, color: 0xff_00_00_ff },
  1: { at: 1, color: 0x00_00_ff_ff },
  length: 2,
};

describe('isRenderablePaintLayer', () => {
  test('gradient with stops renders; zero-stop gradient does not', () => {
    expect(isRenderablePaintLayer(makeLayer({ stops: TWO_STOPS }))).toBe(true);

    expect(isRenderablePaintLayer(makeLayer({}))).toBe(false);
  });

  test('url layer needs an image url', () => {
    expect(
      isRenderablePaintLayer(
        makeLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
        }),
      ),
    ).toBe(true);

    expect(isRenderablePaintLayer(makeLayer({ function: 'URL' }))).toBe(false);
  });

  test('fully transparent layers never render', () => {
    expect(
      isRenderablePaintLayer(makeLayer({ stops: TWO_STOPS, opacity: 0 })),
    ).toBe(false);

    expect(
      isRenderablePaintLayer(
        makeLayer({
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
          opacity: 0,
        }),
      ),
    ).toBe(false);
  });
});
