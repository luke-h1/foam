import { DeferUntilFocused } from '@app/components/DeferUntilFocused/DeferUntilFocused';
import { SettingsIndexScreen } from '@app/screens/SettingsScreen/SettingsIndexScreen';

export default function SettingsRoute() {
  return (
    <DeferUntilFocused>
      <SettingsIndexScreen />
    </DeferUntilFocused>
  );
}
