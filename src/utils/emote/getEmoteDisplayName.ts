import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

export function getEmoteDisplayName(
  emote: Pick<ParsedPart<'emote'>, 'name' | 'original_name' | 'content'>,
): string {
  return emote.name ?? emote.original_name ?? emote.content ?? '';
}
