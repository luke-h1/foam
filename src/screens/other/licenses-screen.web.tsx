import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

import { OtherInfoCard } from './components/other-info-card';

export function LicensesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text type='largeTitle'>Licenses</Text>
        <Text type='subhead' color='gray.textLow'>
          Open-source software used by Foam
        </Text>
      </View>
      <OtherInfoCard
        title='Open-source acknowledgements'
        body='The license list is in the iOS and Android apps.'
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  header: {
    gap: theme.space4,
    paddingBottom: theme.space16,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
