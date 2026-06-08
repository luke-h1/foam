import { usePreferences } from '@app/store/preferences';
import type { SanitisedEmote } from '@app/types/emote';
import { useObservable, useSelector } from '@legendapp/state/react';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
} from '@app/utils/emoji/emojiEmotes';
import { useEffect } from 'react';
import {
  CONTEXT_PREVIEW_KEYS,
  DENSITY_OPTIONS,
  EMOJI_PREVIEW_SHORTCODES,
  PROVIDER_PREVIEW_KEYS,
  type ContextPreviewKey,
  type ContextPreviewValue,
  type ProviderPreviewKey,
  type ProviderPreviewValue,
  type SegmentedControlChangeEvent,
} from './chatPreferenceTypes';

function samePreviewValues<T extends object>(
  left: T,
  right: T,
  keys: readonly (keyof T)[],
): boolean {
  return keys.every(key => left[key] === right[key]);
}

export function useChatPreferenceScreenState() {
  const {
    chatDensity,
    chatTimestamps,
    disableEmoteAnimations,
    emojiStyle,
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
  const previewAlternatingRows = useSelector(previewAlternatingRows$);
  const previewEmojiStyle = useSelector(previewEmojiStyle$);
  const previewContext = useSelector(previewContext$);
  const previewDisableEmoteAnimations = useSelector(
    previewDisableEmoteAnimations$,
  );
  const previewProviders = useSelector(previewProviders$);

  const densityIndex = previewDensity === 'compact' ? 1 : 0;
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

  const handleDensityChange = (event: SegmentedControlChangeEvent) => {
    const nextDensity =
      DENSITY_OPTIONS[event.nativeEvent.selectedSegmentIndex]?.value;

    if (!nextDensity) {
      return;
    }

    handleDensitySelect(nextDensity);
  };

  const handleDensityValueChange = (value: string) => {
    const selected = DENSITY_OPTIONS.find(option => option.label === value);

    if (!selected) {
      return;
    }

    handleDensitySelect(selected.value);
  };

  const handleAlternatingRowsToggle = (value: boolean) => {
    previewAlternatingRows$.set(value);
    update({ showAlternatingChatRows: value });
  };

  const handleEmojiStyleChange = (value: string) => {
    const option = EMOJI_STYLE_OPTIONS.find(option => option.label === value);

    if (!option) {
      return;
    }

    previewEmojiStyle$.set(option.value);
    update({ emojiStyle: option.value });
  };

  const handleEmojiStyleChangeByIndex = (
    event: SegmentedControlChangeEvent,
  ) => {
    const option = EMOJI_STYLE_OPTIONS[event.nativeEvent.selectedSegmentIndex];

    if (!option) {
      return;
    }

    previewEmojiStyle$.set(option.value);
    update({ emojiStyle: option.value });
  };

  return {
    densityIndex,
    emojiIndex,
    emojiLabels,
    emojiPreviewEmotes,
    handleAlternatingRowsToggle,
    handleContextToggle,
    handleDensityChange,
    handleDensityValueChange,
    handleDisableEmoteAnimationsToggle,
    handleEmojiStyleChange,
    handleEmojiStyleChangeByIndex,
    handleProviderToggle,
    previewAlternatingRows,
    previewContext,
    previewDensity,
    previewDisableEmoteAnimations,
    previewProviders,
    showRecentMessages,
    update,
  };
}
