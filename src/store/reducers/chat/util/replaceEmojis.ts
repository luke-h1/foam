import { AllEmotes } from '../types/emote';

/**
 * replace an @param text (i.e. :smile:) with an actual emoji
 */
export default function replaceEmojis(
  emojis: AllEmotes['emoji'],
  text: string,
): string | null {
  if (!emojis) {
    return null;
  }
  return text
    .split(' ')
    .map(word => {
      if (!word.startsWith(':') && !word.endsWith(':')) {
        // not an emoji, just return the text
        return word;
      }

      const id = emojis.names[word];

      // if we have an entry in it, fetch the char else just return the word
      return id ? emojis.entries[id].char : word;
    })
    .join(' ');
}
