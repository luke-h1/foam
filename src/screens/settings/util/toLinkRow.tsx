import { SettingsLinkRow } from '@app/components/settings-section/SettingsLinkRow';

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
