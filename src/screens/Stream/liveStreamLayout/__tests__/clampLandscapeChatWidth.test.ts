import { clampLandscapeChatWidth } from '../clampLandscapeChatWidth';
import { getDefaultLandscapeChatWidth } from '../getDefaultLandscapeChatWidth';

describe('clampLandscapeChatWidth', () => {
  test('clamps sidebar chat width to the landscape bounds', () => {
    expect(clampLandscapeChatWidth(120, 1000, 'sidebar')).toBe(200);
    expect(clampLandscapeChatWidth(900, 1000, 'sidebar')).toBe(550);
    expect(clampLandscapeChatWidth(420, 1000, 'sidebar')).toBe(420);
  });

  test('keeps a user-chosen width narrower than the default on a phone', () => {
    const screenWidth = 780;
    const defaultWidth = getDefaultLandscapeChatWidth('sidebar', screenWidth);
    const narrowed = clampLandscapeChatWidth(230, screenWidth, 'sidebar');

    expect(narrowed).toBe(230);
    expect(narrowed).toBeLessThan(defaultWidth);
  });

  test('allows a wider overlay chat than sidebar chat', () => {
    expect(clampLandscapeChatWidth(800, 1000, 'overlay')).toBe(680);
    expect(clampLandscapeChatWidth(800, 1000, 'sidebar')).toBe(550);
  });
});
