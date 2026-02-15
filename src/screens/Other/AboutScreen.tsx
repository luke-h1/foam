import { Text } from '@app/components/Text/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AboutScreen() {
  return (
    <SafeAreaView edges={['top']}>
      <Text>About</Text>
    </SafeAreaView>
  );
}
