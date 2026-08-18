import { theme } from '@app/styles/themes';

export function getAnnouncementAccentColor(msgParamColor?: string): string {
  switch (msgParamColor?.toUpperCase()) {
    case 'BLUE':
      return theme.color.notice.blue;
    case 'GREEN':
      return theme.color.notice.charity;
    case 'ORANGE':
      return theme.color.notice.orange;
    case 'PURPLE':
      return theme.color.brand.twitch;
    default:
      return theme.color.notice.announcement;
  }
}
