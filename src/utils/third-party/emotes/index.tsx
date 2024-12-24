import Image from '@app/components/Image';
import { Text } from '@app/components/ui/Text';
import { colors } from '@app/styles';
import { View } from 'react-native';
import {
  EmotePositions,
  EmotesParser,
  ParsedEmotesMessage,
  ParserOptions,
} from '../types';
import { loadOptions } from '../util/load-options';
import { stvMessageParser, stvOverlayParser } from './7tv-emotes';
import { bttvMessageParser } from './bttv-emotes';
import { ffzMessageParser } from './ffz-emotes';
import { twitchmessageParser } from './twitch-emotes';

const emoteParsers: EmotesParser[] = [
  twitchmessageParser,
  bttvMessageParser,
  ffzMessageParser,
  stvMessageParser,
  stvOverlayParser,
];

const prepare = async (message: string): Promise<ParsedEmotesMessage> => {
  let currentPos = 0;
  return message.split(' ').map(content => {
    const position = `${currentPos}-${currentPos + content.length - 1}`;
    currentPos += content.length + 1;
    return { content, position };
  });
};

export const reloadEmotes = async (
  _options: Partial<ParserOptions> | null = null,
) => {
  const options = loadOptions(_options);
  emoteParsers.forEach(async parser => {
    if (!options.providers?.[parser.provider]) {
      // eslint-disable-next-line no-useless-return
      return;
    }
    await parser.load(options.channelId, true);
  });
};

export const parseEmotes = async (
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _emotePositions: EmotePositions | null = null,
  _options: Partial<ParserOptions> | null = null,
) => {
  const emotePositions: EmotePositions = _emotePositions || {};
  const options = loadOptions(_options);

  const parsedMessage = await emoteParsers.reduce(
    async (messagePromise, parser) => {
      // eslint-disable-next-line no-shadow
      const message = await messagePromise;
      if (!options.providers?.[parser.provider]) {
        return message;
      }
      return parser.parse(message, emotePositions, options);
    },
    prepare(message),
  );

  return {
    toArray: () => parsedMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toHTML: (scale = 1, inlineStyles = true, escapeHTML = true) => {
      // eslint-disable-next-line no-shadow
      return parsedMessage.map((message, index) => {
        if (!message.emote?.images) {
          const isMention = message.content.startsWith('@');
          const mentionColor = isMention ? colors.error : colors.text;

          return (
            <Text
              // eslint-disable-next-line react/no-array-index-key
              key={`message-${index}`}
              style={{
                marginLeft: 1,
                marginRight: 1,
                flexWrap: 'wrap', // Ensure text wraps on overflow
                color: mentionColor, // Set color for mentions
              }}
            >
              {message.content}
            </Text>
          );
        }

        const emoteURL =
          message.emote.images[scale]?.url || message.emote.images[0].url;

        const height = message.emote.images[scale]?.height || 24;
        const width = message.emote.images[scale]?.width || 24;

        const offset = [2, 4, 6, 8][scale];

        const overlays = (message.emote.overlays || []).map(
          (overlay, overlayIndex) => (
            <Image
              // eslint-disable-next-line react/no-array-index-key
              key={`overlay-${index}-${overlayIndex}`}
              source={overlay.images?.[scale]?.url || overlay.images[0].url}
              alt={overlay.alt}
              style={{
                position: 'absolute',
                width,
                height,
              }}
            />
          ),
        );

        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`message-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              position: 'relative',
              flexWrap: 'wrap', // Ensure text wraps on overflow
            }}
          >
            <Image
              source={emoteURL}
              alt={message.content}
              style={{
                height,
                width,
                marginLeft: inlineStyles ? 0 : offset,
                marginTop: offset,
                marginBottom: offset,
                top: offset,
              }}
            />
            {overlays}
          </View>
        );
      });
    },
  };
};
