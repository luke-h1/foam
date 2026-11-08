import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

import { suggestionRailColors } from './SuggestionRail.styles';

interface SuggestionRailChromeProps {
  children: ReactNode;
  title: string;
}

/**
 * A titled card above the composer.
 */
export function SuggestionRailChrome({
  children,
  title,
}: SuggestionRailChromeProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text type='callout' family='brand' style={styles.headerLabel}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: suggestionRailColors.richContainerBackground,
    borderColor: suggestionRailColors.containerBorder,
    borderCurve: 'continuous',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    boxShadow: suggestionRailColors.shadow,
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space12,
  },
  headerLabel: {
    color: suggestionRailColors.secondaryText,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    letterSpacing: 0.3,
    paddingBottom: theme.space8,
    textTransform: 'uppercase',
  },
  wrapper: {
    marginBottom: theme.space8,
    width: '100%',
    zIndex: 2,
  },
});
