import { Button, Typography } from '@app/components';
import { View } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';

export function LicensesScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button
        onPress={() => ReactNativeLegal.launchLicenseListScreen('OSS licenses')}
      >
        <Typography>OSS licenses</Typography>
      </Button>
    </View>
  );
}
