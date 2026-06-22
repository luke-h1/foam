import { Linking, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import * as AC from '@bacons/apple-colors';

import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import * as Form from '@app/components/Form/Form';
import { SymbolView } from '@app/components/ui/Icon/Icon';

import { AppStoreSection } from './AppStoreSection';
import { ExpoSection } from './ExpoSection';
import { OTADynamicSection } from './OTADynamicSection';
import { OTASection } from './OTASection';

const settingsHintIcon = (
  <SymbolView name='gear' tintColor={AC.secondaryLabel} />
);

export function Diagnostics() {
  const { t } = useTranslation('devTools');

  return (
    <BodyScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.contentContainer}
    >
      <AppStoreSection />
      <ExpoSection />
      <Form.Section title={t('views')}>
        {process.env.EXPO_OS !== 'web' && (
          <Form.Text
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={() => Linking.openSettings()}
            hint={settingsHintIcon}
          >
            {t('openSystemSettings')}
          </Form.Text>
        )}
      </Form.Section>

      <OTADynamicSection />
      <OTASection />
    </BodyScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 100,
  },
});
