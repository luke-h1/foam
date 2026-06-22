import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  EmptyLayout,
  EmptyLayoutContent,
  EmptyLayoutDescription,
  EmptyLayoutHeader,
  EmptyLayoutTitle,
} from '@app/components/EmptyLayout/EmptyLayout';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export function ThemePreferenceScreen() {
  const { t } = useTranslation('preferences');

  return (
    <View style={styles.container}>
      <EmptyLayout variant='outline' style={styles.empty}>
        <EmptyLayoutHeader>
          <EmptyLayoutTitle>{t('foamDarkTitle')}</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            {t('foamDarkDescription')}
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <Text type='sm' color='gray.textLow'>
            {t('foamDarkFootnote')}
          </Text>
        </EmptyLayoutContent>
      </EmptyLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  empty: {
    marginHorizontal: theme.space20,
    minHeight: 320,
  },
});
