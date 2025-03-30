import { AllEmotes } from '../slices/emotes/types';

/** Replaces :smile: with 😊 */
const replaceEmojis = (emojis: AllEmotes['emoji'], text: string) => {
  if (!emojis) return text;

  return text
    .split(' ')
    .map(word => {
      if (!word.startsWith(':') && !word.endsWith(':')) return word;
      const id = emojis.names[word];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return id ? emojis.entries[id].char : word;
    })
    .join(' ');
};

export default replaceEmojis;
