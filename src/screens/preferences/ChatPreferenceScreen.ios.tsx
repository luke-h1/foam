import { StyleSheet, useWindowDimensions } from 'react-native';

import { Form, Host } from '@expo/ui/swift-ui';

import { theme } from '@app/styles/themes';

import { ChatPreferenceFormContextSection } from './components/ChatPreferenceFormContextSection';
import { ChatPreferenceFormEmojiSection } from './components/ChatPreferenceFormEmojiSection';
import { ChatPreferenceFormHighlightsSection } from './components/ChatPreferenceFormHighlightsSection';
import { ChatPreferenceFormLayoutSection } from './components/ChatPreferenceFormLayoutSection';
import { ChatPreferenceFormMediaSection } from './components/ChatPreferenceFormMediaSection';
import { ChatPreferenceFormModerationSection } from './components/ChatPreferenceFormModerationSection';
import { ChatPreferenceFormPerformanceSection } from './components/ChatPreferenceFormPerformanceSection';
import { ChatPreferenceFormProviderSections } from './components/ChatPreferenceFormProviderSections';
import { ChatPreferenceFormSyncSection } from './components/ChatPreferenceFormSyncSection';

export function ChatPreferenceScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = windowWidth - theme.space16 * 2;

  return (
    <Host style={styles.host}>
      <Form>
        <ChatPreferenceFormLayoutSection previewWidth={previewWidth} />
        <ChatPreferenceFormEmojiSection previewWidth={previewWidth} />
        <ChatPreferenceFormContextSection previewWidth={previewWidth} />
        <ChatPreferenceFormSyncSection />
        <ChatPreferenceFormHighlightsSection />
        <ChatPreferenceFormModerationSection />
        <ChatPreferenceFormPerformanceSection />
        <ChatPreferenceFormProviderSections previewWidth={previewWidth} />
        <ChatPreferenceFormMediaSection previewWidth={previewWidth} />
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
