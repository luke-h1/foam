import { BrandIcon } from '@app/components/BrandIcon/BrandIcon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { isBrandIcon } from '@app/utils/typescript/type-guards/isBrandIcon';
import { StyleSheet } from 'react-native';
import type { EmoteMenuIcon as EmoteMenuIconType } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';

const PROVIDER_ACCENT_COLORS: Partial<Record<EmoteMenuIconType, string>> = {
  twitch: theme.colorPlum,
  stv: '#ffffff',
  ffz: theme.colorPrimary,
  bttv: theme.colorOrange,
};

const getProviderAccentColor = (icon: EmoteMenuIconType) =>
  PROVIDER_ACCENT_COLORS[icon] ?? theme.color.text.dark;

interface EmoteMenuIconProps {
  fallbackLabel?: string;
  icon: EmoteMenuIconType;
  isActive: boolean;
}

export function EmoteMenuIcon({
  fallbackLabel,
  icon,
  isActive,
}: EmoteMenuIconProps) {
  if (icon.startsWith('emoji:')) {
    return <Text style={styles.emojiIconText}>{icon.slice(6)}</Text>;
  }

  if (icon === 'ffz') {
    return (
      <Text
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
    <Text style={styles.fallbackIconLabel}>{fallbackLabel}</Text>
  ) : null;
}

const styles = StyleSheet.create({
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
