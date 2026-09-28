import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { Form, Host } from '@expo/ui/swift-ui';

import { usePreferences } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import { getEmojiEmotes } from '@app/utils/emoji/emoji-emotes';

import { EMOJI_PREVIEW_SHORTCODES } from '../util/chat-preference-types';
import { ChatPreferenceFormContextSection } from './chat-preference-form-context-section';
import { ChatPreferenceFormEmojiSection } from './chat-preference-form-emoji-section';
import { ChatPreferenceFormHighlightsSection } from './chat-preference-form-highlights-section';
import { ChatPreferenceFormLayoutSection } from './chat-preference-form-layout-section';
import { ChatPreferenceFormMediaSection } from './chat-preference-form-media-section';
import { ChatPreferenceFormModerationSection } from './chat-preference-form-moderation-section';
import { ChatPreferenceFormPerformanceSection } from './chat-preference-form-performance-section';
import { ChatPreferenceFormProviderSections } from './chat-preference-form-provider-sections';
import { ChatPreferenceFormSyncSection } from './chat-preference-form-sync-section';

export function ChatPreferenceForm() {
  const preferences = usePreferences();
  const { update } = preferences;
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = windowWidth - theme.space16 * 2;

  const emojiPreviewEmotes = useMemo(() => {
    const emotes = getEmojiEmotes(preferences.emojiStyle);

    const preview = EMOJI_PREVIEW_SHORTCODES.flatMap(shortcode => {
      const emote = emotes.find(item => item.name === shortcode);
      return emote ? [emote] : [];
    });

    return preview.length > 0 ? preview : emotes.slice(0, 3);
  }, [preferences.emojiStyle]);

  const contextPreview = {
    chatTimestamps: preferences.chatTimestamps,
    highlightOwnMentions: preferences.highlightOwnMentions,
    showInlineReplyContext: preferences.showInlineReplyContext,
    showUnreadJumpPill: preferences.showUnreadJumpPill,
  };

  return (
    <Host style={styles.host}>
      <Form>
        <ChatPreferenceFormLayoutSection
          preferences={preferences}
          previewWidth={previewWidth}
          update={update}
        />

        <ChatPreferenceFormEmojiSection
          emojiPreviewEmotes={emojiPreviewEmotes}
          preferences={preferences}
          previewWidth={previewWidth}
          update={update}
        />

        <ChatPreferenceFormContextSection
          contextPreview={contextPreview}
          preferences={preferences}
          previewWidth={previewWidth}
          update={update}
        />

        <ChatPreferenceFormSyncSection
          preferences={preferences}
          update={update}
        />

        <ChatPreferenceFormHighlightsSection
          preferences={preferences}
          update={update}
        />

        <ChatPreferenceFormModerationSection
          preferences={preferences}
          update={update}
        />

        <ChatPreferenceFormPerformanceSection
          preferences={preferences}
          update={update}
        />

        <ChatPreferenceFormProviderSections
          preferences={preferences}
          previewWidth={previewWidth}
          update={update}
        />

        <ChatPreferenceFormMediaSection
          preferences={preferences}
          previewWidth={previewWidth}
          update={update}
        />
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
