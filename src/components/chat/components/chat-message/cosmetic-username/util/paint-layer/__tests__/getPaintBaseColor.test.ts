import { makePaint } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';

import { getPaintBaseColor } from '../getPaintBaseColor';

describe('getPaintBaseColor', () => {
  test('returns the paint colour as CSS when it is visible', () => {
    expect(getPaintBaseColor(makePaint({ color: 0xff_00_00_ff }), '#fff')).toBe(
      'rgba(255, 0, 0, 1.000)',
    );
  });

  test('returns the fallback when the paint has no colour', () => {
    expect(getPaintBaseColor(makePaint({ color: null }), '#fff')).toBe('#fff');
  });

  test('returns the fallback when the paint colour is fully transparent', () => {
    expect(getPaintBaseColor(makePaint({ color: 0xff_00_00_00 }), '#fff')).toBe(
      '#fff',
    );
  });
});
