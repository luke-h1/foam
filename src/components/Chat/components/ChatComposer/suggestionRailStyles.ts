import { StyleSheet } from 'react-native';

import { type ColorScheme, theme } from '@app/styles/themes';

/**
 * Surfaces for composer suggestion rails - slate chips, not iOS system gray.
 */
const createSuggestionRailColors = (scheme: ColorScheme) =>
  ({
    chipBackground: theme.color.pressedOverlay[scheme],
    chipBorder: theme.color.border[scheme],
    compactContainerBackground: theme.color.backgroundAltAlpha[scheme],
    containerBorder: theme.color.border[scheme],
    richContainerBackground: theme.color.surfaceElevated[scheme],
    secondaryText: theme.color.textSecondary[scheme],
    shadow:
      scheme === 'dark'
        ? '0 8px 18px rgba(0, 0, 0, 0.28)'
        : '0 8px 18px rgba(16, 30, 50, 0.14)',
    text: theme.color.text[scheme],
  }) as const;

export const suggestionRailColors = {
  light: createSuggestionRailColors('light'),
  dark: createSuggestionRailColors('dark'),
} as const;

const createSuggestionRailStyles = (scheme: ColorScheme) => {
  const colors = suggestionRailColors[scheme];

  return StyleSheet.create({
    compactContainer: {
      alignSelf: 'flex-start',
      backgroundColor: colors.compactContainerBackground,
      borderColor: colors.containerBorder,
      borderCurve: 'continuous',
      borderRadius: theme.borderRadius14,
      borderWidth: 1,
      boxShadow: colors.shadow,
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
      color: colors.secondaryText,
      fontSize: theme.fontSize12,
      fontWeight: '700',
      letterSpacing: 0.3,
      paddingBottom: theme.space8,
      textTransform: 'uppercase',
    },
    richContainer: {
      backgroundColor: colors.richContainerBackground,
      borderColor: colors.containerBorder,
      borderCurve: 'continuous',
      borderRadius: theme.borderRadius28,
      borderWidth: 1,
      boxShadow: colors.shadow,
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
};

export const suggestionRailStyles = {
  light: createSuggestionRailStyles('light'),
  dark: createSuggestionRailStyles('dark'),
} as const;
