import { View } from 'react-native';

import { SettingsRow } from '@app/components/settings-section/SettingsRow';
import type { SettingsToggleRowProps } from '@app/components/settings-section/SettingsSection.types';
import { Switch } from '@app/components/switch/Switch';

export function SettingsToggleRow({
  onValueChange,
  value,
  ...rowProps
}: SettingsToggleRowProps) {
  return (
    <SettingsRow
      {...rowProps}
      // oxlint-disable-next-line react-doctor/jsx-no-jsx-as-prop -- the React Compiler memoizes this element
      trailing={
        <View>
          <Switch
            accessibilityLabel={rowProps.title}
            value={value}
            onValueChange={onValueChange}
          />
        </View>
      }
    />
  );
}
