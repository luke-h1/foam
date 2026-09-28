import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';

import { ChatPreferenceDefaultContent } from './components/chat-preference-default-content';
import { ChatPreferenceForm } from './components/chat-preference-form';

export function ChatPreferenceScreen() {
  if (Platform.OS === 'ios') {
    return <ChatPreferenceForm />;
  }

  return <ChatPreferenceScrollContent />;
}

export function ChatPreferenceScrollContent() {
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentInsetAdjustmentBehavior='automatic'
      indicatorStyle='white'
      contentContainerStyle={styles.content}
    >
      <ChatPreferenceDefaultContent />
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
