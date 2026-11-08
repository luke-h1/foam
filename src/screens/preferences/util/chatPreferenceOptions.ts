import { getOptionIndex } from '@app/components/settings-section/SettingsSection.types';
import type { ChatDelaySetting } from '@app/store/preference-store';
import type { SanitisedEmote } from '@app/types/emote';
import { type EmojiStyle, getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';

import { CHAT_DELAY_OPTIONS, EMOJI_PREVIEW_SHORTCODES } from '../constants';

/**
 * The SwiftUI picker tag for a chat delay. SwiftUI matches tags of one type,
 * and the delay mixes 'auto'/'off' with numbers, so the tag is a string.
 */
export function chatDelayOptionTag(value: ChatDelaySetting): string {
  const option = CHAT_DELAY_OPTIONS[getOptionIndex(CHAT_DELAY_OPTIONS, value)];

  return String(option?.value);
}

export function getEmojiPreviewEmotes(style: EmojiStyle): SanitisedEmote[] {
  const emotes = getEmojiEmotes(style);

  const preview = EMOJI_PREVIEW_SHORTCODES.flatMap(shortcode => {
    const emote = emotes.find(item => item.name === shortcode);
    return emote ? [emote] : [];
  });

  return preview.length > 0 ? preview : emotes.slice(0, 3);
}
