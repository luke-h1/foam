import { memo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import type { EmoteMenuIcon as EmoteMenuIconType } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { Image } from '@app/components/Image/Image';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { type ColorScheme, theme } from '@app/styles/themes';
import { isBrandIcon } from '@app/utils/typescript/type-guards/isBrandIcon';

const getProviderAccentColors = (
  scheme: ColorScheme,
): Partial<Record<EmoteMenuIconType, string>> => ({
  twitch: theme.color.twitch[scheme],
  stv: theme.color.text[scheme],
  ffz: theme.color.accent[scheme],
  bttv: theme.color.orange[scheme],
});

const PROVIDER_ACCENT_COLORS = {
  light: getProviderAccentColors('light'),
  dark: getProviderAccentColors('dark'),
} as const;

const getProviderAccentColor = (icon: EmoteMenuIconType, scheme: ColorScheme) =>
  PROVIDER_ACCENT_COLORS[scheme][icon] ?? theme.color.text[scheme];

interface EmoteMenuIconProps {
  fallbackLabel?: string;
  icon: EmoteMenuIconType;
  isActive: boolean;
}

function EmoteMenuIconComponent({
  fallbackLabel,
  icon,
  isActive,
}: EmoteMenuIconProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (icon.startsWith('avatar:')) {
    return (
      <Image
        source={icon.slice(7)}
        style={styles.avatarIcon}
        containerStyle={styles.avatarIconContainer}
        transition={100}
      />
    );
  }

  if (icon.startsWith('emoji:')) {
    return <Text style={styles.emojiIconText}>{icon.slice(6)}</Text>;
  }

  if (icon === 'ffz') {
    return (
      <Text
        style={[
          styles.fallbackIconLabel,
          {
            color: isActive
              ? theme.color.text[scheme]
              : theme.color.accent[scheme],
          },
        ]}
      >
        FFZ
      </Text>
    );
  }

  if (icon === 'twitch') {
    return (
      <SymbolView
        name='play.tv.fill'
        size={16}
        tintColor={
          isActive
            ? theme.color.text[scheme]
            : getProviderAccentColor(icon, scheme)
        }
      />
    );
  }

  if (isBrandIcon(icon)) {
    return (
      <BrandIcon
        name={icon}
        size='sm'
        color={
          isActive
            ? theme.color.text[scheme]
            : getProviderAccentColor(icon, scheme)
        }
      />
    );
  }

  return fallbackLabel ? (
    <Text
      style={[styles.fallbackIconLabel, { color: theme.color.text[scheme] }]}
    >
      {fallbackLabel}
    </Text>
  ) : null;
}

export const EmoteMenuIcon = memo(EmoteMenuIconComponent);

const styles = StyleSheet.create({
  avatarIcon: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  avatarIconContainer: {
    borderRadius: 12,
    height: 24,
    overflow: 'hidden',
    width: 24,
  },
  emojiIconText: {
    fontSize: 16,
  },
  fallbackIconLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
