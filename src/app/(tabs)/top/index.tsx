import { TopScreen } from '@app/screens';
import { SafeAreaView } from 'react-native-safe-area-context';

// eslint-disable-next-line camelcase
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TopView() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopScreen />
    </SafeAreaView>
  );
}
