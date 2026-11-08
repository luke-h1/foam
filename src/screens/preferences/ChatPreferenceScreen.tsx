import { useRef } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet } from 'react-native';

import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';

import { ChatPreferenceContextSection } from './components/ChatPreferenceContextSection';
import { ChatPreferenceEmojiSection } from './components/ChatPreferenceEmojiSection';
import { ChatPreferenceHighlightsSection } from './components/ChatPreferenceHighlightsSection';
import { ChatPreferenceLayoutSection } from './components/ChatPreferenceLayoutSection';
import { ChatPreferenceMediaSection } from './components/ChatPreferenceMediaSection';
import { ChatPreferenceModerationSection } from './components/ChatPreferenceModerationSection';
import { ChatPreferencePerformanceSection } from './components/ChatPreferencePerformanceSection';
import { ChatPreferenceSyncSection } from './components/ChatPreferenceSyncSection';
import { ChatProviderPreferenceSections } from './components/ChatProviderPreferenceSections';

export function ChatPreferenceScreen() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentInsetAdjustmentBehavior='automatic'
      indicatorStyle='white'
      contentContainerStyle={styles.content}
    >
      <ChatPreferenceLayoutSection />
      <ChatPreferenceEmojiSection />
      <ChatPreferenceContextSection />
      <ChatPreferenceSyncSection />
      <ChatPreferenceHighlightsSection />
      <ChatPreferenceModerationSection />
      <ChatPreferencePerformanceSection />
      <ChatProviderPreferenceSections />
      <ChatPreferenceMediaSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
});
