import { View } from 'react-native';

import { ListItem, RNHostView } from '@expo/ui/jetpack-compose';
import { alpha, clickable } from '@expo/ui/jetpack-compose/modifiers';

import { SettingsRowLeading } from '@app/components/settings-section/components/SettingsRowLeading.android';
import { SettingsRowText } from '@app/components/settings-section/components/SettingsRowText.android';
import { listItemColors } from '@app/components/settings-section/constants';
import type { SettingsRowProps } from '@app/components/settings-section/SettingsSection.types';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { theme } from '@app/styles/themes';

function getRowModifiers(
  onPress: (() => void) | undefined,
  disabled: boolean | undefined,
) {
  if (disabled) {
    return [alpha(0.4)];
  }

  return onPress ? [clickable(onPress, { indication: true })] : [];
}

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
  return (
    <ListItem
      colors={listItemColors}
      modifiers={getRowModifiers(onPress, disabled)}
    >
      <SettingsRowLeading {...{ icon, danger }} />
      <SettingsRowText {...{ title, subtitle, danger }} />
      {trailing || (onPress && chevron) ? (
        <ListItem.TrailingContent>
          <RNHostView matchContents>
            {trailing ? (
              <View>{trailing}</View>
            ) : (
              <SymbolView
                name='chevron.right'
                size={18}
                tintColor={theme.colorGreyHoverAlpha}
              />
            )}
          </RNHostView>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}
