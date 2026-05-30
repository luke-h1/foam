import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import * as Form from '@app/components/Form/Form';
import { SymbolView } from 'expo-symbols';
import * as AC from '@bacons/apple-colors';
import { Linking, StyleSheet } from 'react-native';
import { AppStoreSection } from './AppStoreSection';
import { ExpoSection } from './ExpoSection';
import { OTADynamicSection } from './OTADynamicSection';
import { OTASection } from './OTASection';

export function Diagnostics() {
  return (
    <BodyScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
    >
      <AppStoreSection />
      <ExpoSection />
      <Form.Section title="Views">
        {process.env.EXPO_OS !== 'web' && (
          <Form.Text
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={() => Linking.openSettings()}
            hint={<SymbolView name="gear" tintColor={AC.secondaryLabel} />}
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
