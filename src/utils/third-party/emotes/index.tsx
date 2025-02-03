import { Typography } from '@app/components';
import { Image } from 'expo-image';
import { Linking, View } from 'react-native';
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
    await parser.load(options.channelId, true);
  });
};

export const parseEmotes = async (
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _emotePositions: EmotePositions | null = null,
  options: Partial<ParserOptions> | null = null,
) => {
  const emotePositions: EmotePositions = _emotePositions || {};

  const parsedMessage = await emoteParsers.reduce(
    async (messagePromise, parser) => {
      // eslint-disable-next-line no-shadow
      const message = await messagePromise;

      return parser.parse(message, emotePositions, {
        channelId: options?.channelId as unknown as string,
      });
    },
    prepare(message),
  );

  return {
    toArray: () => parsedMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toHTML: (
      scale: 1 | 2 | 3 | 4 = 1,
      inlineStyles = true,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _escapeHTML = true,
    ) => {
      // eslint-disable-next-line no-shadow
      return parsedMessage.map((message, index) => {
        if (!message.emote) {
          // const isMention = message.content.startsWith('@');
          // const mentionColor = isMention
          //   ? theme.colors.angry100
          //   : theme.colors.accent200;

          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts = message.content.split(urlRegex);

          const elements = parts.map((part, i) => {
            if (urlRegex.test(part)) {
              return (
                <Typography
                  // eslint-disable-next-line react/no-array-index-key
                  key={`link-${index}-${i}`}
                  style={{ color: '#004EFF' }}
                  onPress={() => Linking.openURL(part)}
                >
                  {part}
                </Typography>
              );
            }
            return part;
          });

          return (
            <Typography
              // eslint-disable-next-line react/no-array-index-key
              key={`message-${index}`}
              style={{
                marginLeft: 1,
                marginRight: 1,
                // color: 'mentionColor',
              }}
            >
              {elements}
            </Typography>
          );
        }

        const emoteURL =
          message.emote.images[scale]?.url || message.emote.images[0]?.url;

        const height = message.emote.images[scale]?.height || 24;
        const width = message.emote.images[scale]?.width || 24;

        const offset = [2, 4, 6, 8][scale];

        const overlays = (message.emote.overlays || []).map(
          (overlay, overlayIndex) => (
            <Image
              // eslint-disable-next-line react/no-array-index-key
              key={`overlay-${index}-${overlayIndex}`}
              source={overlay.images?.[scale]?.url || overlay.images[0]?.url}
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
              flexWrap: 'wrap',
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
