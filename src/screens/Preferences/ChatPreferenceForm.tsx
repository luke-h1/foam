import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { Form, Host } from '@expo/ui/swift-ui';

import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';

import { ChatPreferenceFormContextSection } from './ChatPreferenceFormContextSection';
import { ChatPreferenceFormEmojiSection } from './ChatPreferenceFormEmojiSection';
import { ChatPreferenceFormHighlightsSection } from './ChatPreferenceFormHighlightsSection';
import { ChatPreferenceFormLayoutSection } from './ChatPreferenceFormLayoutSection';
import { ChatPreferenceFormMediaSection } from './ChatPreferenceFormMediaSection';
import { ChatPreferenceFormModerationSection } from './ChatPreferenceFormModerationSection';
import { ChatPreferenceFormPerformanceSection } from './ChatPreferenceFormPerformanceSection';
import { ChatPreferenceFormProviderSections } from './ChatPreferenceFormProviderSections';
import { ChatPreferenceFormSyncSection } from './ChatPreferenceFormSyncSection';
import { EMOJI_PREVIEW_SHORTCODES } from './chatPreferenceTypes';

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
