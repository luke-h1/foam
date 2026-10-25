import { noticeSurfaceTint } from '@app/components/chat/components/util/chatNoticeAccents';

describe('chatNoticeAccents', () => {
  describe('noticeSurfaceTint', () => {
    test('converts a hex color to rgba with the default alpha', () => {
      expect(noticeSurfaceTint('#EB0400')).toBe('rgba(235, 4, 0, 0.06)');
    });

    test('supports a custom alpha', () => {
      expect(noticeSurfaceTint('#1475E1', 0.12)).toBe(
        'rgba(20, 117, 225, 0.12)',
      );
    });

    test('falls back to neutral gray for invalid hex values', () => {
      expect(noticeSurfaceTint('not-a-color')).toBe(
        'rgba(127, 127, 127, 0.06)',
      );

      expect(noticeSurfaceTint('#FFF')).toBe('rgba(127, 127, 127, 0.06)');
    });
  });
});
