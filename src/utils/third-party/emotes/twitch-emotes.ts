import { EmotesParser, MessageParser } from '../types';

const parseTwitchEmotes: MessageParser = async (
  message,
  emotePositions = {},
) => {
  return message.map(word => {
    const emoteIdx = Object.values(emotePositions).findIndex(emotePos =>
      emotePos.includes(word.position),
    );

    if (emoteIdx >= 0 && !word.emote) {
      const emoteId = Object.keys(emotePositions)[emoteIdx];

      return {
        ...word,
        emote: {
          images: ['1.0', '2.0', '3.0'].map(scale => ({
            height: 30,
            width: 30,
            url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/${scale}`,
          })),
        },
      };
    }
    return word;
  });
};

export const twitchmessageParser: EmotesParser = {
  provider: 'twitch',
  parse: parseTwitchEmotes,
  load: async () => {},
};
