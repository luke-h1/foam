import { Button } from '@app/components/Button';
import { Typography } from '@app/components/Typography';
import { ReactNativeLegal } from 'react-native-legal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export function LicensesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Button
        onPress={() => ReactNativeLegal.launchLicenseListScreen('OSS licenses')}
      >
        <Typography>OSS licenses</Typography>
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
