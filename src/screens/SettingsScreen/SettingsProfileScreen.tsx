import { Menu } from '@app/components/Menu';
import { SafeAreaView } from 'react-native';
import { ProfileCard } from './components/profile/ProfileCard';

export function SettingsProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Menu header={<ProfileCard />} items={[]} />
    </SafeAreaView>
  );
}
