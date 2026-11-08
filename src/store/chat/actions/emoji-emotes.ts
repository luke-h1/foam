import { type EmojiStyle, getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';

import { chatStore$ } from '../observables/chat-store';

export const setEmojiEmotes = (style: EmojiStyle) => {
  chatStore$.emojis.set(getEmojiEmotes(style));
};
