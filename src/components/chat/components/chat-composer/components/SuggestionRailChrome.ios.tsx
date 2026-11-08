import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { theme } from '@app/styles/themes';

import { suggestionRailColors } from './SuggestionRail.styles';

interface SuggestionRailChromeProps {
  children: ReactNode;
  title: string;
}

export function SuggestionRailChrome({ children }: SuggestionRailChromeProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    backgroundColor: suggestionRailColors.compactContainerBackground,
    borderColor: suggestionRailColors.containerBorder,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    boxShadow: suggestionRailColors.shadow,
    maxWidth: '100%',
    paddingBottom: 4,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  wrapper: {
    marginBottom: 6,
    maxWidth: '100%',
    zIndex: 2,
  },
});
