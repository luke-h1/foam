import { SettingsLinkRow } from '@app/components/settings-section/SettingsSection';

import type { SettingsMenuRow } from './settingsMenu';

/**
 * `SettingsSection` draws a separator between its direct children, and on
 * Android it draws only its own row types in Compose. So map the rows in
 * place with this function. Do not wrap them in a component.
 */
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
