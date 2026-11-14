import type { SFSymbol } from 'sf-symbols-typescript';

import { SettingsLinkRow } from '@app/components/settings-section/SettingsLinkRow';
import { SettingsRow } from '@app/components/settings-section/SettingsRow';
import { SettingsSection } from '@app/components/settings-section/SettingsSection';
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

interface SheetDetail {
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
