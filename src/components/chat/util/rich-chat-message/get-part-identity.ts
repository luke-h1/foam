import type { ParsedPart } from '@app/utils/chat/parsed-part';

export function getPartIdentity(part: ParsedPart, index: number): string {
  return `${part.type}-${index}`;
}
