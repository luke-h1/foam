import {
  makePaint,
  toIndexed,
} from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';
import type { PaintShadow } from '@app/types/seven-tv/cosmetics';

import { getPaintDropShadows } from '../getPaintDropShadows';

const firstShadow: PaintShadow = {
  x_offset: 1,
  y_offset: 1,
  radius: 2,
  color: 255,
};

const secondShadow: PaintShadow = {
  x_offset: -1,
  y_offset: -1,
  radius: 4,
  color: 65_535,
};

const makeShadowPaint = (shadows: PaintShadow[]) =>
  makePaint({ shadows: toIndexed(shadows) });

describe('getPaintDropShadows', () => {
  test('renders all shadows, matching the extension default', () => {
    const paint = makeShadowPaint([firstShadow, secondShadow]);

    expect(getPaintDropShadows(paint)).toEqual<PaintShadow[]>([
      firstShadow,
      secondShadow,
    ]);
  });

  test('returns the cached list for the same paint', () => {
    const paint = makeShadowPaint([firstShadow]);

    expect(getPaintDropShadows(paint)).toBe(getPaintDropShadows(paint));
  });
});
