import { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

type LiveBadgeTone = 'overlay' | 'tinted';

interface LiveBadgeProps {
  tone?: LiveBadgeTone;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const LiveBadge = memo(function LiveBadge({
  tone = 'overlay',
  label = 'LIVE',
  style,
}: LiveBadgeProps) {
  const isTinted = tone === 'tinted';

  return (
    <View
      style={[styles.pill, isTinted ? styles.tinted : styles.overlay, style]}
    >
      <View style={styles.dot} />
      <Text
        type='caption'
        weight='semibold'
        tabular
        style={isTinted ? styles.tintedLabel : styles.overlayLabel}
      >
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.sm,
    columnGap: 5,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  overlay: {
    backgroundColor: theme.color.scrim.dark,
  },
  tinted: {
    backgroundColor: theme.colorRedSurface,
  },
  dot: {
    backgroundColor: theme.color.live.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    height: 6,
    width: 6,
  },
  overlayLabel: {
    color: theme.color.text.dark,
  },
  tintedLabel: {
    color: theme.color.live.dark,
  },
});
