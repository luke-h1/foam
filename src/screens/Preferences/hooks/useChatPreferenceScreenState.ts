import { useEffect } from 'react';

import { useObservable, useSelector } from '@legendapp/state/react';

import { usePreferences } from '@app/store/preferences/selectors';
import type { SanitisedEmote } from '@app/types/emote';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
} from '@app/utils/emoji/emojiEmotes';

import {
  CHAT_DELAY_OPTIONS,
  CONTEXT_PREVIEW_KEYS,
  type ContextPreviewKey,
  type ContextPreviewValue,
  DELETED_STYLE_OPTIONS,
  DENSITY_OPTIONS,
  EMOJI_PREVIEW_SHORTCODES,
  FONT_SCALE_OPTIONS,
  PROVIDER_PREVIEW_KEYS,
  type ProviderPreviewKey,
  type ProviderPreviewValue,
  SCROLLBACK_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
} from '../types/chatPreferenceTypes';

function samePreviewValues<T extends object>(
  left: T,
  right: T,
  keys: readonly (keyof T)[],
): boolean {
  return keys.every(key => left[key] === right[key]);
}

export function useChatPreferenceScreenState() {
  const {
    animate,
    chatDelay,
    chatDensity,
    chatFontScale,
    chatMentionHaptics,
    chatScrollback,
    chatTimestampFormat,
    chatTimestamps,
    deletedMessageStyle,
    disableEmoteAnimations,
    emojiStyle,
    ignoreClearChat,
    highlightOwnMentions,
    showAlternatingChatRows,
    showInlineReplyContext,
    showRecentMessages,
    showUnreadJumpPill,
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
    update,
  } = usePreferences();

  const previewDensity$ = useObservable(chatDensity);
  const previewFontScale$ = useObservable(chatFontScale);
  const previewAlternatingRows$ = useObservable(showAlternatingChatRows);
  const previewEmojiStyle$ = useObservable(emojiStyle);
  const previewContext$ = useObservable<ContextPreviewValue>({
    chatTimestamps,
    highlightOwnMentions,
    showInlineReplyContext,
    showUnreadJumpPill,
  });
  const previewDisableEmoteAnimations$ = useObservable(disableEmoteAnimations);
  const previewProviders$ = useObservable<ProviderPreviewValue>({
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
  });

  const previewDensity = useSelector(previewDensity$);
  const previewFontScale = useSelector(previewFontScale$);
  const previewAlternatingRows = useSelector(previewAlternatingRows$);
  const previewEmojiStyle = useSelector(previewEmojiStyle$);
  const previewContext = useSelector(previewContext$);
  const previewDisableEmoteAnimations = useSelector(
    previewDisableEmoteAnimations$,
  );
  const previewProviders = useSelector(previewProviders$);

  const densityIndex = previewDensity === 'compact' ? 1 : 0;
  const fontScaleIndex = Math.max(
    0,
    FONT_SCALE_OPTIONS.findIndex(option => option.value === chatFontScale),
  );
  const timestampFormatIndex = Math.max(
    0,
    TIMESTAMP_FORMAT_OPTIONS.findIndex(
      option => option.value === chatTimestampFormat,
    ),
  );
  const deletedStyleIndex = Math.max(
    0,
    DELETED_STYLE_OPTIONS.findIndex(
      option => option.value === deletedMessageStyle,
    ),
  );
  const scrollbackIndex = Math.max(
    0,
    SCROLLBACK_OPTIONS.findIndex(option => option.value === chatScrollback),
  );
  const chatDelayIndex = Math.max(
    0,
    CHAT_DELAY_OPTIONS.findIndex(option => option.value === chatDelay),
  );
  const emojiLabels = EMOJI_STYLE_OPTIONS.map(option => option.label);
  const emojiIndex = Math.max(
    0,
    EMOJI_STYLE_OPTIONS.findIndex(option => option.value === previewEmojiStyle),
  );

  const emojiPreviewEmotes: SanitisedEmote[] = (() => {
    const emotes = getEmojiEmotes(previewEmojiStyle);
    const preview = EMOJI_PREVIEW_SHORTCODES.flatMap(shortcode => {
      const emote = emotes.find(item => item.name === shortcode);
      return emote ? [emote] : [];
    });

    if (preview.length > 0) {
      return preview;
    }

    return emotes.slice(0, 3);
  })();

  useEffect(() => {
    previewDensity$.set(chatDensity);
  }, [chatDensity, previewDensity$]);

  useEffect(() => {
    previewFontScale$.set(chatFontScale);
  }, [chatFontScale, previewFontScale$]);

  useEffect(() => {
    previewAlternatingRows$.set(showAlternatingChatRows);
  }, [previewAlternatingRows$, showAlternatingChatRows]);

  useEffect(() => {
    previewEmojiStyle$.set(emojiStyle);
  }, [emojiStyle, previewEmojiStyle$]);

  useEffect(() => {
    const nextContext = {
      chatTimestamps,
      highlightOwnMentions,
      showInlineReplyContext,
      showUnreadJumpPill,
    };
    previewContext$.set(previous =>
      samePreviewValues(previous, nextContext, CONTEXT_PREVIEW_KEYS)
        ? previous
        : nextContext,
    );
  }, [
    chatTimestamps,
    highlightOwnMentions,
    previewContext$,
    showInlineReplyContext,
    showUnreadJumpPill,
  ]);

  useEffect(() => {
    previewDisableEmoteAnimations$.set(disableEmoteAnimations);
  }, [disableEmoteAnimations, previewDisableEmoteAnimations$]);

  useEffect(() => {
    const nextProviders = {
      show7TvEmotes,
      show7tvBadges,
      showBttvEmotes,
      showBttvBadges,
      showFFzEmotes,
      showFFzBadges,
      showTwitchEmotes,
      showTwitchBadges,
    };
    previewProviders$.set(previous =>
      samePreviewValues(previous, nextProviders, PROVIDER_PREVIEW_KEYS)
        ? previous
        : nextProviders,
    );
  }, [
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
    previewProviders$,
  ]);

  const handleContextToggle = (key: ContextPreviewKey, value: boolean) => {
    previewContext$.set(previous =>
      previous[key] === value
        ? previous
        : {
            ...previous,
            [key]: value,
          },
    );
    update({ [key]: value });
  };

  const handleProviderToggle = (key: ProviderPreviewKey, value: boolean) => {
    previewProviders$.set(previous =>
      previous[key] === value
        ? previous
        : {
            ...previous,
            [key]: value,
          },
    );
    update({ [key]: value });
  };

  const handleDisableEmoteAnimationsToggle = (value: boolean) => {
    previewDisableEmoteAnimations$.set(value);
    update({ disableEmoteAnimations: value });
  };

  const handleDensitySelect = (nextDensity: 'comfortable' | 'compact') => {
    previewDensity$.set(nextDensity);
    update({
      chatDensity: nextDensity,
    });
  };

  const handleDensityChange = (index: number) => {
    const nextDensity = DENSITY_OPTIONS[index]?.value;

    if (!nextDensity) {
      return;
    }

    handleDensitySelect(nextDensity);
  };

  const handleFontScaleChange = (index: number) => {
    const option = FONT_SCALE_OPTIONS[index];
    if (option) {
      previewFontScale$.set(option.value);
      update({ chatFontScale: option.value });
    }
  };

  const handleTimestampFormatChange = (index: number) => {
    const option = TIMESTAMP_FORMAT_OPTIONS[index];
    if (option) {
      update({ chatTimestampFormat: option.value });
    }
  };

  const handleDeletedStyleChange = (index: number) => {
    const option = DELETED_STYLE_OPTIONS[index];
    if (option) {
      update({ deletedMessageStyle: option.value });
    }
  };

  const handleScrollbackChange = (index: number) => {
    const option = SCROLLBACK_OPTIONS[index];
    if (option) {
      update({ chatScrollback: option.value });
    }
  };

  const handleChatDelayChange = (index: number) => {
    const option = CHAT_DELAY_OPTIONS[index];
    if (option) {
      update({ chatDelay: option.value });
    }
  };

  const handleAlternatingRowsToggle = (value: boolean) => {
    previewAlternatingRows$.set(value);
    update({ showAlternatingChatRows: value });
  };

  const handleEmojiStyleChange = (index: number) => {
    const option = EMOJI_STYLE_OPTIONS[index];

    if (!option) {
      return;
    }

    previewEmojiStyle$.set(option.value);
    update({ emojiStyle: option.value });
  };

  return {
    animate,
    chatDelayIndex,
    chatMentionHaptics,
    deletedStyleIndex,
    densityIndex,
    emojiIndex,
    fontScaleIndex,
    handleDeletedStyleChange,
    handleFontScaleChange,
    handleChatDelayChange,
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
    previewFontScale,
    previewDisableEmoteAnimations,
    previewProviders,
    showRecentMessages,
    update,
  };
}
