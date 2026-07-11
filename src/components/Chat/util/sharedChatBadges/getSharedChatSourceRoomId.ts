import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';

export function getSharedChatSourceRoomId(
  userstate: UserStateTags,
): string | undefined {
  const sourceRoomId = userstate['source-room-id'];
  if (!sourceRoomId) {
    return undefined;
  }

  return sourceRoomId;
}
