import { Menu } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <Screen safeAreaEdges={['top']} preset="fixed">
      <Menu header={<ProfileCard />} items={[]} />
    </Screen>
  );
}
