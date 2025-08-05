import { Button, Text } from '@app/components';
import { View } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';

export function LicensesScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button
        onPress={() => ReactNativeLegal.launchLicenseListScreen('OSS licenses')}
      >
        <Text variant="title">OSS licenses</Text>
      </Button>
    </View>
  );
}
