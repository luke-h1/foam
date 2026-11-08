import { SettingsIndexAndroidList } from './components/SettingsIndexAndroidList';
import { useSettingsIndexState } from './hooks/use-settings-index-state';

export function SettingsIndexScreen() {
  return <SettingsIndexAndroidList {...useSettingsIndexState()} />;
}
