import { Button, Typography } from '@app/components';
import { ReactNativeLegal } from 'react-native-legal';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LicensesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Button
        onPress={() => ReactNativeLegal.launchLicenseListScreen('OSS licenses')}
      >
        <Typography>OSS licenses</Typography>
      </Button>
    </SafeAreaView>
  );
}
