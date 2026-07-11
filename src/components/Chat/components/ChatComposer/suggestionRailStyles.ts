import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

/**
 * Surfaces for composer suggestion rails — slate chips, not iOS system gray.
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

export const suggestionRailStyles = StyleSheet.create({
  compactContainer: {
    alignSelf: 'flex-start',
    backgroundColor: suggestionRailColors.compactContainerBackground,
    borderColor: suggestionRailColors.containerBorder,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius14,
    borderWidth: 1,
    boxShadow: suggestionRailColors.shadow,
    maxWidth: '100%',
    paddingBottom: 4,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  compactWrapper: {
    marginBottom: 6,
    maxWidth: '100%',
    zIndex: 2,
  },
  headerLabel: {
    color: suggestionRailColors.secondaryText,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    letterSpacing: 0.3,
    paddingBottom: theme.space8,
    textTransform: 'uppercase',
  },
  richContainer: {
    backgroundColor: suggestionRailColors.richContainerBackground,
    borderColor: suggestionRailColors.containerBorder,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    boxShadow: suggestionRailColors.shadow,
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space12,
  },
  richWrapper: {
    marginBottom: theme.space8,
    width: '100%',
    zIndex: 2,
  },
});
