import { memo, useMemo } from 'react';
import {
  type StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';

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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const isTinted = tone === 'tinted';

  const schemeStyles = useMemo(
    () => ({
      dot: { backgroundColor: theme.color.live[scheme] },
      overlay: { backgroundColor: theme.color.overlay[scheme] },
      tinted: {
        backgroundColor: theme.color.dangerSurface[scheme],
        borderColor: theme.color.dangerBorder[scheme],
      },
      tintedLabel: { color: theme.color.live[scheme] },
    }),
    [scheme],
  );

  return (
    <View
      style={[
        styles.pill,
        isTinted ? schemeStyles.tinted : [styles.overlay, schemeStyles.overlay],
        style,
      ]}
    >
      <View style={[styles.dot, schemeStyles.dot]} />
      <Text
        type='xxs'
        weight='bold'
        style={
          isTinted
            ? [styles.tintedLabel, schemeStyles.tintedLabel]
            : styles.overlayLabel
        }
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
    paddingVertical: theme.space4,
  },
  overlay: {
    borderColor: theme.color.border.dark,
  },
  dot: {
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
    letterSpacing: 0.4,
  },
});
