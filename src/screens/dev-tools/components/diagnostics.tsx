import { Linking, StyleSheet } from 'react-native';

import * as AC from '@bacons/apple-colors';

import { BodyScrollView } from '@app/components/body-scroll-view/body-scroll-view';
import * as Form from '@app/components/form/form';
import { SymbolView } from '@app/components/ui/icon/icon';

import { AppStoreSection } from './app-store-section';
import { ExpoSection } from './expo-section';
import { OTADynamicSection } from './ota-dynamic-section';
import { OTASection } from './ota-section';

const settingsHintIcon = (
  <SymbolView name='gear' tintColor={AC.secondaryLabel} />
);

export function Diagnostics() {
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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
