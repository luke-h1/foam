import { SettingsIndexIOSForm } from './components/SettingsIndexIosForm';
import { useSettingsIndexState } from './hooks/use-settings-index-state';

export function SettingsIndexScreen() {
  return <SettingsIndexIOSForm {...useSettingsIndexState()} />;
}
