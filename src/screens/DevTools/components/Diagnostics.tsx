import { BodyScrollView } from '@app/components';
import * as Form from '@app/components/Form/Form';
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import * as AC from '@bacons/apple-colors';
import { Linking, SafeAreaView } from 'react-native';
import { AppStoreSection } from './AppStoreSection';
import { ExpoSection } from './ExpoSection';
import { OTADynamicSection } from './OTADynamicSection';
import { OTASection } from './OTASection';

export function Diagnostics() {
  return (
    <SafeAreaView>
      <BodyScrollView>
        <AppStoreSection />
        <ExpoSection />
        <Form.Section title="Views">
          {process.env.EXPO_OS !== 'web' && (
            <Form.Text
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress={() => Linking.openSettings()}
              hint={<IconSymbol name="gear" color={AC.secondaryLabel} />}
            >
              Open System Settings
            </Form.Text>
          )}
        </Form.Section>

        <OTADynamicSection />
        <OTASection />
      </BodyScrollView>
    </SafeAreaView>
  );
}
