import { getDefaultLandscapeChatWidth } from '../get-default-landscape-chat-width';

describe('getDefaultLandscapeChatWidth', () => {
  test('uses mode-specific default landscape chat widths', () => {
    expect(getDefaultLandscapeChatWidth('overlay', 1000)).toBe(380);
    expect(getDefaultLandscapeChatWidth('overlay', 600)).toBe(276);
    expect(getDefaultLandscapeChatWidth('sidebar', 1000)).toBe(350);
  });
});
