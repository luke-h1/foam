const ANNOUNCEMENT_ACCENT_COLORS = {
  PRIMARY: '#EB0400',
  BLUE: '#1475E1',
  GREEN: '#00AD03',
  ORANGE: '#FF6905',
  PURPLE: '#9147FF',
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
