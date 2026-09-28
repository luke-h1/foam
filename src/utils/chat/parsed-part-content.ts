import type { ParsedPart } from './parsed-part';

export function getParsedPartStringContent(part: ParsedPart): string {
  if (!('content' in part)) {
    return '';
  }

  const { content } = part;
  return String(content) === content ? content : '';
}
