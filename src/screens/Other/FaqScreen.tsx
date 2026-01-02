import { Text } from '@app/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export function FaqScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>FAQ</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
