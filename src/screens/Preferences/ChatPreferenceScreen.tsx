import { useRef } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';

import { ChatPreferenceDefaultContent } from './ChatPreferenceDefaultContent';
import { ChatPreferenceNativeForm } from './ChatPreferenceNativeForm';
import { useChatPreferenceScreenState } from './useChatPreferenceScreenState';

export function ChatPreferenceScreen() {
  if (Platform.OS === 'ios') {
    return <ChatPreferenceNativeForm />;
  }

  return <ChatPreferenceScrollContent />;
}

export function ChatPreferenceScrollContent() {
  const state = useChatPreferenceScreenState();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <ChatPreferenceDefaultContent {...state} />
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
