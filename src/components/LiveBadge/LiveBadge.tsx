import { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
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
        type='xxs'
        weight='bold'
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
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    columnGap: theme.space4,
    flexDirection: 'row',
    paddingHorizontal: theme.space8,
    paddingVertical: 3,
  },
  overlay: {
    backgroundColor: theme.colorBlackOverlay,
    borderColor: theme.colorBorderSecondary,
  },
  tinted: {
    backgroundColor: theme.colorRedSurface,
    borderColor: theme.colorRedBorder,
  },
  dot: {
    backgroundColor: theme.color.live.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 6,
    width: 6,
  },
  overlayLabel: {
    color: theme.color.text.dark,
    letterSpacing: 0.4,
  },
  tintedLabel: {
    color: theme.color.live.dark,
    letterSpacing: 0.4,
  },
});
