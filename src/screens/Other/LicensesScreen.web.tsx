import { StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { theme } from '@app/styles/themes';

import { OtherInfoCard } from './components/OtherInfoCard';

export function LicensesScreen() {
  const { t } = useTranslation('licenses');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
      edges={['top']}
    >
      <ScreenHeader title={t('title')} subtitle={t('subtitle')} size='medium' />
      <OtherInfoCard title={t('acknowledgements')} body={t('bodyWeb')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
