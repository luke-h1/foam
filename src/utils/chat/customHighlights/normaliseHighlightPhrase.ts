import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

export function normaliseHighlightPhrase(phrase: string): string {
  return normaliseChatText(phrase);
}
