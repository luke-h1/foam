import { StyleSheet, View } from 'react-native';

import { PressableArea } from '@app/components/pressable-area/PressableArea';
import {
  resolveIconName,
  type SettingsRowProps,
} from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';

export function SettingsRow({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  danger,
  disabled,
  chevron = true,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.row, disabled ? styles.disabled : null]}>
      {icon ? (
        <View style={[styles.iconWrap, danger ? styles.iconWrapDanger : null]}>
          <SymbolView
            name={resolveIconName(icon.icon, icon.androidIcon)}
            size={20}
            tintColor={danger ? theme.colorRed : theme.color.textSecondary.dark}
          />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text color={danger ? 'red' : 'gray'}>{title}</Text>
        {subtitle ? (
          <Text type='subhead' color='gray.textLow'>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ??
        (onPress && chevron ? (
          <SymbolView
            name='chevron.right'
            size={18}
            tintColor={theme.colorGreyHoverAlpha}
          />
        ) : null)}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableArea
      accessibilityLabel={title}
      accessibilityRole='button'
      {...(disabled ? { accessibilityState: { disabled }, disabled } : {})}
      onPress={onPress}
    >
      {content}
    </PressableArea>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: theme.space8,
    minWidth: 0,
  },
  disabled: {
    opacity: 0.4,
  },
  iconWrap: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radius.sm,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  iconWrapDanger: {
    opacity: 0.9,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
});
