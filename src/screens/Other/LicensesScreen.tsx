import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReactNativeLegal } from 'react-native-legal';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { OtherInfoCard } from './components/OtherInfoCard';

export function LicensesScreen() {
  const { t } = useTranslation('licenses');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
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
    flex: 1,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  cta: {
    marginTop: theme.space16,
  },
});
