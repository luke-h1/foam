import { DeferUntilFocused } from '@app/components/defer-until-focused/defer-until-focused';
import { SettingsIndexScreen } from '@app/screens/settings-screen/settings-index-screen';

export default function SettingsRoute() {
  return (
    <DeferUntilFocused>
      <SettingsIndexScreen />
    </DeferUntilFocused>
  );
}
