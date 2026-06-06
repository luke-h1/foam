import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';
import { OtherInfoCard } from './components/OtherInfoCard';

export function LicensesScreen() {
  return (
    <View style={styles.container}>
      <OtherInfoCard
        title='Open-source acknowledgements'
        body='Launch the native license list to inspect bundled dependencies and attribution details.'
      >
        <Button
          onPress={() =>
            ReactNativeLegal.launchLicenseListScreen('OSS licenses')
          }
          style={styles.cta}
        >
          <Text weight='semibold'>Open license list</Text>
        </Button>
      </OtherInfoCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  cta: {
    marginTop: theme.space16,
  },
});
