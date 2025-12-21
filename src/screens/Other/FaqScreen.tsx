import { Typography } from '@app/components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export function FaqScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Typography>FAQ</Typography>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
