import { SuggestionState } from '../types';
import { HtmlEmote } from '../types/emote';

export default function replaceSuggestionText(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { activeIndex, end, isActive, items, start, type }: SuggestionState,
): string {
  if (items.length === 0) {
    return text;
  }

  const currentItem = items[activeIndex];

  const insertedText =
    type === 'users' ? `@${currentItem}` : (currentItem as HtmlEmote).alt;

  const textBefore = text.substring(0, start);
  const textAfter = text.substring(end) || '';

  return `${textBefore}${insertedText}${textAfter}`;
}
