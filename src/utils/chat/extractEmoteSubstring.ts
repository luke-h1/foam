export function extractEmoteSubstring(emoteStr: string) {
  if (typeof emoteStr === 'object' && Object.keys(emoteStr).length === 0) {
    return emoteStr;
  }

  if (typeof emoteStr === 'object') {
    return emoteStr;
  }

  const emoteList = emoteStr.split(',');

  const emoteTable: Record<string, string[]> = {};

  emoteList.forEach(emote => {
    const [emoteId, position] = emote.split(':');

    emoteTable[emoteId as string] = emoteTable[emoteId as string] || [];
    if (emoteId) {
      emoteTable[emoteId]?.push(position as string);
    }
  });

  return emoteTable;
}
