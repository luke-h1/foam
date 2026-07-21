import { StyleSheet, useWindowDimensions } from 'react-native';

import { Form, Host } from '@expo/ui/swift-ui';

import { theme } from '@app/styles/themes';

import { ChatFormBehaviorSections } from './ChatFormBehaviorSections';
import { ChatFormLayoutSections } from './ChatFormLayoutSections';
import { ChatFormProviderSections } from './ChatFormProviderSections';

export function ChatPreferenceForm() {
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = windowWidth - theme.space16 * 2;

  return (
    <Host style={styles.host}>
      <Form>
        <ChatFormLayoutSections previewWidth={previewWidth} />
        <ChatFormBehaviorSections previewWidth={previewWidth} />
        <ChatFormProviderSections previewWidth={previewWidth} />
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
