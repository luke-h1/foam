export function extractEmoteSubstring(emoteStr: string) {
  if (typeof emoteStr === 'object' && Object.keys(emoteStr).length === 0) {
    return emoteStr;
  }

  if (typeof emoteStr === 'object') {
    return emoteStr;
  }

  const emoteList = emoteStr.split(',');

  let emoteTable: Record<string, string[]> = {};

  emoteList.forEach(emote => {
    const [emoteId, position] = emote.split(':');
    const [start, end] = position?.split('-').map(Number);

    emoteTable[emoteId] = emoteTable[emoteId] || [];
    if (emoteId) {
      emoteTable[emoteId].push(position);
    }
  });

  return emoteTable;
}
