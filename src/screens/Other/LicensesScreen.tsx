import { Button } from '@app/components/Button';
import { Text } from '@app/components/Text';
import { ReactNativeLegal } from 'react-native-legal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export function LicensesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Button
        onPress={() => ReactNativeLegal.launchLicenseListScreen('OSS licenses')}
      >
        <Text>OSS licenses</Text>
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
}));
