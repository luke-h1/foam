import { DeferUntilFocused } from '@app/components/defer-until-focused/DeferUntilFocused';
import { SettingsIndexScreen } from '@app/screens/settings/SettingsIndexScreen';

export default function SettingsRoute() {
  return (
    <DeferUntilFocused>
      <SettingsIndexScreen />
    </DeferUntilFocused>
  );
}
