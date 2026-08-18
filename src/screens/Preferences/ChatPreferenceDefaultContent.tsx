import { ChatPreferenceContextSection } from './ChatPreferenceContextSection';
import { ChatPreferenceEmojiSection } from './ChatPreferenceEmojiSection';
import { ChatPreferenceHighlightsSection } from './ChatPreferenceHighlightsSection';
import { ChatPreferenceLayoutSection } from './ChatPreferenceLayoutSection';
import { ChatPreferenceMediaSection } from './ChatPreferenceMediaSection';
import { ChatPreferenceModerationSection } from './ChatPreferenceModerationSection';
import { ChatPreferencePerformanceSection } from './ChatPreferencePerformanceSection';
import { ChatPreferenceSyncSection } from './ChatPreferenceSyncSection';
import { ChatProviderPreferenceSections } from './ChatProviderPreferenceSections';
import { useChatPreferenceScreenState } from './useChatPreferenceScreenState';

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
