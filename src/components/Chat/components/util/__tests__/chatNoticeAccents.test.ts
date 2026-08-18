import { theme } from '@app/styles/themes';

import { CHAT_NOTICE_ACCENTS, noticeSurfaceTint } from '../chatNoticeAccents';

describe('chatNoticeAccents', () => {
  describe('CHAT_NOTICE_ACCENTS', () => {
    test('wires each notice accent to its theme color', () => {
      expect(CHAT_NOTICE_ACCENTS).toEqual({
        announcement: theme.color.notice.announcement,
        channelPoints: theme.colorViolet,
        highlight: theme.color.notice.muted,
        subscription: theme.color.notice.subscription,
        charity: theme.color.notice.charity,
        ritual: theme.colorViolet,
        firstMessage: theme.colorViolet,
        returningChatter: theme.colorBlue,
        viewerMilestone: theme.colorViolet,
        modAnniversary: theme.colorTeal,
        raid: theme.colorOrange,
        replyToYou: theme.color.notice.announcement,
        stvAdded: theme.colorPrimary,
        stvRemoved: theme.color.notice.announcement,
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
