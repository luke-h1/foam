import { EmotePositions, EmoteIDs } from '@app/services/ffzService2';

export const getTwitchEmotesFromMessage = async (
  message: string,
  emotePositions: EmotePositions | null,
): Promise<EmoteIDs> => {
  const emotes: EmoteIDs = new Map();
  if (!emotePositions) {
    return emotes;
  }

  Object.keys(emotePositions).forEach(id => {
    const position = emotePositions[id][0].split('-');
    const start = parseInt(position[0], 10);
    const end = parseInt(position[1], 10) + 1;
    const code = message.substring(start, end);
    emotes.set(code, id);
  });

  return emotes;
};
