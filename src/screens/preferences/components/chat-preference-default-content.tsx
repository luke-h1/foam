import { useChatPreferenceScreenState } from '../hooks/use-chat-preference-screen-state';
import { ChatPreferenceContextSection } from './chat-preference-context-section';
import { ChatPreferenceEmojiSection } from './chat-preference-emoji-section';
import { ChatPreferenceHighlightsSection } from './chat-preference-highlights-section';
import { ChatPreferenceLayoutSection } from './chat-preference-layout-section';
import { ChatPreferenceMediaSection } from './chat-preference-media-section';
import { ChatPreferenceModerationSection } from './chat-preference-moderation-section';
import { ChatPreferencePerformanceSection } from './chat-preference-performance-section';
import { ChatPreferenceSyncSection } from './chat-preference-sync-section';
import { ChatProviderPreferenceSections } from './chat-provider-preference-sections';

export function ChatPreferenceDefaultContent() {
  const {
    animate,
    chatDelayIndex,
    chatMentionHaptics,
    deletedStyleIndex,
    densityIndex,
    emojiIndex,
    fontScaleIndex,
    previewFontScale,
    handleChatDelayChange,
    handleDeletedStyleChange,
    handleFontScaleChange,
    handleScrollbackChange,
    handleTimestampFormatChange,
    ignoreClearChat,
    scrollbackIndex,
    timestampFormatIndex,
    emojiLabels,
    emojiPreviewEmotes,
    handleAlternatingRowsToggle,
    handleContextToggle,
    handleDensityChange,
    handleDisableEmoteAnimationsToggle,
    handleEmojiStyleChange,
    handleProviderToggle,
    previewAlternatingRows,
    previewContext,
    previewDensity,
    previewDisableEmoteAnimations,
    previewProviders,
    showRecentMessages,
    update,
  } = useChatPreferenceScreenState();

  return (
    <>
      <ChatPreferenceLayoutSection
        animate={animate}
        densityIndex={densityIndex}
        fontScaleIndex={fontScaleIndex}
        handleDensityChange={handleDensityChange}
        handleFontScaleChange={handleFontScaleChange}
        onAlternatingRowsToggle={handleAlternatingRowsToggle}
        onAnimateChange={value => update({ animate: value })}
        previewAlternatingRows={previewAlternatingRows}
        previewDensity={previewDensity}
        previewFontScale={previewFontScale}
      />

      <ChatPreferenceEmojiSection
        emojiIndex={emojiIndex}
        emojiLabels={emojiLabels}
        emojiPreviewEmotes={emojiPreviewEmotes}
        handleEmojiStyleChange={handleEmojiStyleChange}
      />

      <ChatPreferenceContextSection
        handleContextToggle={handleContextToggle}
        handleTimestampFormatChange={handleTimestampFormatChange}
        onShowRecentMessagesChange={value =>
          update({ showRecentMessages: value })
        }
        previewContext={previewContext}
        showRecentMessages={showRecentMessages}
        timestampFormatIndex={timestampFormatIndex}
      />

      <ChatPreferenceSyncSection
        chatDelayIndex={chatDelayIndex}
        handleChatDelayChange={handleChatDelayChange}
      />

      <ChatPreferenceHighlightsSection
        chatMentionHaptics={chatMentionHaptics}
        onChatMentionHapticsChange={value =>
          update({ chatMentionHaptics: value })
        }
      />

      <ChatPreferenceModerationSection
        deletedStyleIndex={deletedStyleIndex}
        handleDeletedStyleChange={handleDeletedStyleChange}
        ignoreClearChat={ignoreClearChat}
        onIgnoreClearChatChange={value => update({ ignoreClearChat: value })}
      />

      <ChatPreferencePerformanceSection
        handleScrollbackChange={handleScrollbackChange}
        scrollbackIndex={scrollbackIndex}
      />

      <ChatProviderPreferenceSections
        previewProviders={previewProviders}
        onProviderToggle={handleProviderToggle}
      />

      <ChatPreferenceMediaSection
        handleDisableEmoteAnimationsToggle={handleDisableEmoteAnimationsToggle}
        previewDisableEmoteAnimations={previewDisableEmoteAnimations}
      />
    </>
  );
}
