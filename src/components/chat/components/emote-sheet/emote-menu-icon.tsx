import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { BrandIcon } from '@app/components/brand-icon/brand-icon';
import type { BrandIconName } from '@app/components/brand-icon/util/brand-icon-registry';
import { isBrandIcon } from '@app/components/brand-icon/util/is-brand-icon';
import type { EmoteMenuIcon as EmoteMenuIconType } from '@app/components/chat/components/emote-sheet/util/emote-menu-data';
import { Image } from '@app/components/image/image';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

type ProviderAccentIcon = BrandIconName | 'ffz' | 'twitch';

const PROVIDER_ACCENT_COLORS = {
  twitch: theme.colorPlum,
  stv: theme.colorWhite,
  ffz: theme.colorPrimary,
  bttv: theme.colorOrange,
} satisfies Record<ProviderAccentIcon, string>;

const getProviderAccentColor = (icon: ProviderAccentIcon) =>
  PROVIDER_ACCENT_COLORS[icon];

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
  if (icon.startsWith('avatar:')) {
    return (
      <Image
        source={icon.slice(7)}
        cacheVariant='avatar'
        style={styles.avatarIcon}
        containerStyle={styles.avatarIconContainer}
        transition={100}
      />
    );
  }

  if (icon.startsWith('emoji:')) {
    return (
      <Text type='callout' family='brand' style={styles.emojiIconText}>
        {icon.slice(6)}
      </Text>
    );
  }

  if (icon === 'ffz') {
    return (
      <Text
        type='callout'
        family='brand'
        style={[
          styles.fallbackIconLabel,
          styles.ffzTextIcon,
          isActive && styles.ffzTextIconActive,
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
          isActive ? theme.color.text.dark : getProviderAccentColor(icon)
        }
      />
    );
  }

  if (isBrandIcon(icon)) {
    return (
      <BrandIcon
        name={icon}
        size='sm'
        color={isActive ? theme.color.text.dark : getProviderAccentColor(icon)}
      />
    );
  }

  return fallbackLabel ? (
    <Text type='callout' family='brand' style={styles.fallbackIconLabel}>
      {fallbackLabel}
    </Text>
  ) : null;
}

export const EmoteMenuIcon = memo(EmoteMenuIconComponent);

const styles = StyleSheet.create({
  avatarIcon: {
    borderRadius: 12,
    borderCurve: 'continuous',
    height: 24,
    width: 24,
  },
  avatarIconContainer: {
    borderRadius: 12,
    borderCurve: 'continuous',
    height: 24,
    overflow: 'hidden',
    width: 24,
  },
  emojiIconText: {
    fontSize: 16,
  },
  fallbackIconLabel: {
    color: theme.color.text.dark,
    fontSize: 11,
    fontWeight: '700',
  },
  ffzTextIcon: {
    color: theme.colorPrimary,
  },
  ffzTextIconActive: {
    color: theme.color.text.dark,
  },
});
