import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@app/components/ui/Text/Text';
import type { ColorScheme } from '@app/styles/themes';
import { deriveChannelAccent } from '@app/utils/color/deriveChannelAccent';

interface Props {
  seed: string;
  initial: string;
  scheme: ColorScheme;
  style?: StyleProp<ViewStyle>;
}

/**
 * Gradient avatar shown for streamers without a cached profile picture. The
 * palette is derived deterministically from the channel seed, so a given
 * channel keeps the same orb across renders and sessions.
 */
export const ChannelAvatarOrb = memo(function ChannelAvatarOrb({
  seed,
  initial,
  scheme,
  style,
}: Props) {
  const accent = deriveChannelAccent(seed, scheme);

  return (
    <LinearGradient
      colors={accent.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      <Text type='md' weight='bold' style={{ color: accent.text }}>
        {initial}
      </Text>
    </LinearGradient>
  );
});
