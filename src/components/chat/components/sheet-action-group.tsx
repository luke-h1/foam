import type { SFSymbol } from 'sf-symbols-typescript';

import {
  SettingsLinkRow,
  SettingsRow,
  SettingsSection,
} from '@app/components/settings-section/settings-section';
import { theme } from '@app/styles/themes';

export interface SheetAction {
  icon: SFSymbol;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface SheetActionGroupProps {
  title?: string;
  actions: SheetAction[];
}

/**
 * A group of action rows in a chat sheet. Each row runs in place, so it has
 * no chevron.
 */
export function SheetActionGroup({ title, actions }: SheetActionGroupProps) {
  return (
    <SettingsSection title={title} cardColor={theme.color.surfaceElevated.dark}>
      {actions.map(action => (
        <SettingsRow
          key={action.label}
          icon={{ icon: action.icon }}
          title={action.label}
          danger={action.destructive}
          disabled={action.disabled}
          chevron={false}
          onPress={action.onPress}
        />
      ))}
    </SettingsSection>
  );
}

export interface SheetDetail {
  label: string;
  value?: string | null;
}

export function SheetDetailGroup({ details }: { details: SheetDetail[] }) {
  return (
    <SettingsSection
      title='Details'
      cardColor={theme.color.surfaceElevated.dark}
    >
      {details.map(detail => (
        <SettingsLinkRow
          key={detail.label}
          title={detail.label}
          value={detail.value ?? undefined}
        />
      ))}
    </SettingsSection>
  );
}
