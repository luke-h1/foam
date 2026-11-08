import { Linking, StyleSheet } from 'react-native';

import * as AC from '@bacons/apple-colors';

import { BodyScrollView } from '@app/components/body-scroll-view/BodyScrollView';
import * as Form from '@app/components/form/Form';
import { SymbolView } from '@app/components/ui/icon/Icon';

import { AppStoreSection } from './components/AppStoreSection';
import { ExpoSection } from './components/ExpoSection';
import { OTADynamicSection } from './components/OtaDynamicSection';
import { OTASection } from './components/OtaSection';

const settingsHintIcon = (
  <SymbolView name='gear' tintColor={AC.secondaryLabel} />
);

export function DiagnosticsScreen() {
  return (
    <BodyScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.contentContainer}
    >
      <AppStoreSection />
      <ExpoSection />
      <Form.Section title='Views'>
        {process.env.EXPO_OS !== 'web' && (
          <Form.Text
            onPress={() => Linking.openSettings()}
            hint={settingsHintIcon}
          >
            Open System Settings
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
