import { ParsedPart } from '@app/utils/chat/parsedPart';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

export function extractTextFromMessage(message: ParsedPart[]): string {
  return replaceEmotesWithText(message);
}
