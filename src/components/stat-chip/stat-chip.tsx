import { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

interface StatChipProps {
  label: string;
  style?: StyleProp<ViewStyle>;
}

export const StatChip = memo(function StatChip({
  label,
  style,
}: StatChipProps) {
  return (
    <View style={[styles.pill, style]}>
      <Text type='xxs' weight='bold' style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackOverlay,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: theme.space8,
    paddingVertical: 3,
  },
  label: {
    color: theme.color.text.dark,
    letterSpacing: 0.3,
  },
});
