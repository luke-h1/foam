import type { ParsedPart } from './replaceTextWithEmotes';

export function getParsedPartStringContent(part: ParsedPart): string {
  return 'content' in part && typeof part.content === 'string'
    ? part.content
    : '';
}
