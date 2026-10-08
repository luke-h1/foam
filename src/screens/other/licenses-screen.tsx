import { StyleSheet, View } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';

import { Button } from '@app/components/button/button';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

import { OtherInfoCard } from './components/other-info-card';

export function LicensesScreen() {
  return (
    <View style={styles.container}>
      <OtherInfoCard
        title='Open-source acknowledgements'
        body='See the licenses and attributions for the libraries Foam uses.'
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
    paddingTop: theme.space16,
  },
  cta: {
    marginTop: theme.space16,
  },
});
