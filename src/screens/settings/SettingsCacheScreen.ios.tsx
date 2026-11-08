import { StyleSheet } from 'react-native';

import {
  Button,
  Form,
  Host,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';

import { confirmClearCache, confirmClearSavedData } from './util/cacheActions';

export function SettingsCacheScreen() {
  return (
    <Host style={styles.host}>
      <Form>
        <Section
          footer={
            <NativeText>
              Removes cached emotes, badges, 7TV cosmetics and images. They
              download again when needed.
            </NativeText>
          }
        >
          <Button
            label='Clear cache'
            systemImage='trash'
            // oxlint-disable-next-line react-doctor/aria-role -- SwiftUI Button role, not ARIA
            role='destructive'
            onPress={confirmClearCache}
          />
        </Section>
        <Section
          footer={
            <NativeText>
              Removes Foam data on this device and loads everything fresh. You
              stay signed in.
            </NativeText>
          }
        >
          <Button
            label='Clear saved data'
            systemImage='externaldrive'
            // oxlint-disable-next-line react-doctor/aria-role -- SwiftUI Button role, not ARIA
            role='destructive'
            onPress={confirmClearSavedData}
          />
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
