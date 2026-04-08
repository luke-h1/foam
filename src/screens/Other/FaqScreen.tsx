import { Text } from '@app/components/Text/Text';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FaqScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text>FAQ</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
