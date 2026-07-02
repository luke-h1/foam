import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';

import { OtherInfoCard } from './components/OtherInfoCard';

export function LicensesScreen() {
  const { t } = useTranslation('licenses');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('title')} subtitle={t('subtitle')} size='medium' />
      <OtherInfoCard title={t('acknowledgements')} body={t('bodyWeb')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
