import { ScreenHeader } from '@app/components';
import { Screen } from '@app/components/Screen';
import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <ScreenHeader
        title="Profile"
        subtitle="Account info & preferences"
        size="medium"
      />
      <ProfileCard />
    </Screen>
  );
}
