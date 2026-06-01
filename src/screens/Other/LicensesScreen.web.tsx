import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtherInfoCard } from './components/OtherInfoCard';

export function LicensesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title='Licenses'
        subtitle='Open-source software used by Foam'
        size='medium'
      />
      <OtherInfoCard
        title='Open-source acknowledgements'
        body='The native license list is available in the iOS and Android apps.'
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
