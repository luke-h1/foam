import { ListItem, Switch } from '@expo/ui/jetpack-compose';

import { SettingsRowLeading } from '@app/components/settings-section/components/SettingsRowLeading.android';
import { SettingsRowText } from '@app/components/settings-section/components/SettingsRowText.android';
import { listItemColors } from '@app/components/settings-section/constants';
import type { SettingsToggleRowProps } from '@app/components/settings-section/SettingsSection.types';
import { iosMatchedSwitchColors } from '@app/styles/compose-switch-colors';

export function SettingsToggleRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
}: SettingsToggleRowProps) {
  return (
    <ListItem colors={listItemColors}>
      <SettingsRowLeading icon={icon} />
      <SettingsRowText {...{ title, subtitle }} />
      <ListItem.TrailingContent>
        <Switch
          value={value}
          onCheckedChange={onValueChange}
          colors={iosMatchedSwitchColors}
        />
      </ListItem.TrailingContent>
    </ListItem>
  );
}
