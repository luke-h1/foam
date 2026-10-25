import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';

export function getSharedChatSourceRoomId(
  userstate: UserStateTags,
): string | undefined {
  return userstate['source-room-id'] || undefined;
}
