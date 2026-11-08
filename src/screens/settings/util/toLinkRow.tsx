import { SettingsLinkRow } from '@app/components/settings-section/SettingsSection';

import type { SettingsMenuRow } from './settingsMenu';

export function toLinkRow(row: SettingsMenuRow) {
  return (
    <SettingsLinkRow
      key={row.label}
      title={row.label}
      subtitle={row.subtitle}
      icon={row}
      onPress={row.onPress}
    />
  );
}
