export function isSharedChatDuplicatedNotice(tags: {
  'source-room-id'?: string;
  'room-id'?: string;
}): boolean {
  const sourceRoomId = tags['source-room-id'];
  const roomId = tags['room-id'];
  return Boolean(sourceRoomId && roomId && sourceRoomId !== roomId);
}
