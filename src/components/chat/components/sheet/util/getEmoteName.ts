import type { MessageToken } from '@app/types/chat/messageToken';

export function getEmoteName(emote: MessageToken<'emote'>): string {
  return emote.name ?? emote.original_name ?? emote.content;
}
