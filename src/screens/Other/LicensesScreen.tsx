import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LicensesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Button
        onPress={() => ReactNativeLegal.launchLicenseListScreen('OSS licenses')}
      >
        <Text>OSS licenses</Text>
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
});
