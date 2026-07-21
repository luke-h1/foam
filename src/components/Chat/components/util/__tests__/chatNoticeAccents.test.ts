jest.mock('@app/styles/themes', () => ({
  theme: {
    color: {
      violet: { dark: '#9147FF' },
      orange: { dark: '#FF6905' },
      blue: { dark: '#1E90FF' },
      accent: { dark: '#00F593' },
      notice: {
        announcement: '#EB0400',
        muted: '#ADADB8',
        subscription: '#FFD700',
        charity: '#00AD03',
      },
    },
  },
}));

import { CHAT_NOTICE_ACCENTS, noticeSurfaceTint } from '../chatNoticeAccents';

describe('chatNoticeAccents', () => {
  describe('CHAT_NOTICE_ACCENTS', () => {
    test('exposes the expected notice accent palette', () => {
      expect(CHAT_NOTICE_ACCENTS).toEqual({
        announcement: '#EB0400',
        channelPoints: '#9147FF',
        highlight: '#ADADB8',
        subscription: '#FFD700',
        charity: '#00AD03',
        ritual: '#9147FF',
        firstMessage: '#9147FF',
        returningChatter: '#1E90FF',
        viewerMilestone: '#9147FF',
        raid: '#FF6905',
        replyToYou: '#EB0400',
        stvAdded: '#00F593',
        stvRemoved: '#EB0400',
      });
    });
  });

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
