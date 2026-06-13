import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { StyleSheet, View } from 'react-native';
import { ReactNativeLegal } from 'react-native-legal';
import { OtherInfoCard } from './components/OtherInfoCard';
import { useTranslation } from 'react-i18next';

export function LicensesScreen() {
  const { t } = useTranslation('licenses');

  return (
    <View style={styles.container}>
      <OtherInfoCard title={t('acknowledgements')} body={t('body')}>
        <Button
          onPress={() =>
            ReactNativeLegal.launchLicenseListScreen(t('ossLicenses'))
          }
          style={styles.cta}
        >
          <Text weight='semibold'>{t('openLicenseList')}</Text>
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
