import { theme } from '@app/styles/themes';

/**
 * Surfaces for composer suggestion rails - slate chips, not iOS system gray.
 */
export const suggestionRailColors = {
  chipBackground: theme.darkActiveContent,
  chipBorder: theme.color.border.dark,
  compactContainerBackground: theme.color.background.darkAltAlpha,
  containerBorder: theme.color.border.dark,
  richContainerBackground: theme.color.surfaceElevated.dark,
  secondaryText: theme.color.textSecondary.dark,
  shadow: '0 8px 18px rgba(0, 0, 0, 0.28)',
  text: theme.color.text.dark,
} as const;
