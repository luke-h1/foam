import { theme } from '@app/styles/themes';
const ANNOUNCEMENT_ACCENT_COLORS = {
  PRIMARY: theme.color.notice.announcement,
  BLUE: theme.color.notice.blue,
  GREEN: theme.color.notice.charity,
  ORANGE: theme.color.notice.orange,
  PURPLE: theme.color.brand.twitch,
} as const;

export function getAnnouncementAccentColor(msgParamColor?: string): string {
  if (!msgParamColor) {
    return ANNOUNCEMENT_ACCENT_COLORS.PRIMARY;
  }

  const normalised =
    msgParamColor.toUpperCase() as keyof typeof ANNOUNCEMENT_ACCENT_COLORS;
  return (
    ANNOUNCEMENT_ACCENT_COLORS[normalised] ?? ANNOUNCEMENT_ACCENT_COLORS.PRIMARY
  );
}
