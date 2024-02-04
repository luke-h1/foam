/* eslint-disable no-console */
import { Text } from '@app/components/Text';
import { EmotePositions } from '@app/services/ffzService2';
import { Image } from 'expo-image';
import { ParseEmoteOptions, Word, emoteFactory } from '../emotes/emoteFactory';

const defaultOptions: ParseEmoteOptions = {
  thirdPartyProviders: {
    bttv: true,
    ffz: true,
    seventv: true,
  },
  customEmotes: [],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toHtml = (words: Word[], size: number) => {
  return words.map(word => {
    if (word.emote?.url[0].includes('7tv')) {
      console.log('url is ', word.emote?.url[0]);
      return word.emote ? (
        <Image
          source={{
            uri: word.emote.url[0],
          }}
          style={{
            width: 100,
            height: 100,
            resizeMode: 'contain',
            // gif support
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            animation: word.emote.url[0].includes('.webp')
              ? 'fade 0.5s infinite'
              : 'none',
          }}
        />
      ) : (
        <Text>{word.text}</Text>
      );
    }

    return word.emote ? (
      <Image
        source={{
          uri: word.emote.url as unknown as string,
        }}
        style={{
          width: 100,
          height: 100,
        }}
      />
    ) : (
      <Text>{word.text}</Text>
    );
  });
};

export const parseEmotes = async (
  message: string,
  // eslint-disable-next-line default-param-last
  emotePositions: EmotePositions | null = null,
  options?: Partial<ParseEmoteOptions>,
) => {
  const factory = await emoteFactory(message, emotePositions, {
    ...defaultOptions,
    ...options,
    thirdPartyProviders: {
      seventv: true,
      bttv: false,
      ffz: false,
    },
  });

  const words: Word[] = message.split(' ').map(text => {
    const word: Word = { text };
    // eslint-disable-next-line no-shadow
    factory.forEach(factory => {
      if (factory.provider === '7tv') {
        const emoteCode = factory.list.get(text)?.trim() as string;

        if (typeof emoteCode === 'undefined') {
          console.log(`${text} is not a 7tv emote`);
          // not found in any emote list so just return the text
          return text.trim();
        }

        word.emote = { url: factory.make(emoteCode) };

        return word;
      }

      if (!factory.list.get(text)) {
        console.log(`${text} is not a match`);
        // not found in any emote list so just return the text
        return text.trim();
      }

      word.emote = { url: factory.make(text) };

      return word;
    });
    return word;
  });
  return {
    toWords: () => words,
    toHtml: (size = 0) => toHtml(words, size),
  };
};
