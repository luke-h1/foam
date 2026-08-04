import type { ParsedPart } from '@app/utils/chat/parsedPart';

export function getPartIdentity(part: ParsedPart, index: number): string {
  return `${part.type}-${index}`;
}
