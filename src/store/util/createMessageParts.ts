/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-constant-condition */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-unreachable-loop */
import urlRegex from 'url-regex-safe';
import {
  MessagePart,
  MessagePartEmoteModifier,
  MessagePartType,
} from '../services/types/messages';
import { AllEmotes } from '../slices/emotes/types';
import isEmoteModifier from './isEmoteModifier';

/* eslint-disable no-restricted-syntax */
const MENTION_REGEX = /^(@([\p{Letter}\p{Number}_]+))(.*)/u;
const LINK_REGEX = urlRegex({ strict: false });

// https://discuss.dev.twitch.tv/t/28414/2
const getCodePointsCount = (string: string) => {
  let count = 0;
  for (const _char of string) count += 1;
  return count;
};

export type EmoteOffsets = Record<string, [string, string]>;

/**
 * Example `emotes` tag: `25:0-4,12-16/1902:6-10/354:18-22`
 * @returns `Record<start: string, emoteId: string>`
 */
const parseEmoteOffsets = (emotesTag: string) => {
  const result: Record<string, string> = {};
  if (!emotesTag) return result;
  const entries = emotesTag.split('/').map(emote => emote.split(':'));
  for (const [id, positions] of entries) {
    for (const position of positions!.split(',')) {
      const [start] = position.split('-');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      result[start] = id;
    }
  }
  return result;
};

/** Pushes emote modifier to `modifier` field if possible */
const addEmoteModifier = (
  messageParts: MessagePart[],
  part: MessagePartEmoteModifier,
) => {
  const minus1part = messageParts.at(-1);
  const minus2part = messageParts.at(-2);

  // if -1st part is only spaces
  // and -2nd part is an emote
  if (
    minus1part?.type === MessagePartType.TEXT &&
    minus1part?.content.trim() === '' &&
    (minus2part?.type === MessagePartType.TWITCH_EMOTE ||
      minus2part?.type === MessagePartType.BTTV_EMOTE ||
      minus2part?.type === MessagePartType.FFZ_EMOTE ||
      minus2part?.type === MessagePartType.STV_EMOTE ||
      minus2part?.type === MessagePartType.EMOJI)
  ) {
    minus2part.content.modifiers.push(part);
  } else {
    messageParts.push(part);
  }
};

const createMessageParts = (
  message: string,
  emotes: AllEmotes,
  emotesTag = '',
  isSelf = false,
): MessagePart[] => {
  const words = message.split(' ');

  const messageParts: MessagePart[] = [];
  let i = 0;
  let offset = 0;
  const emoteOffsets = parseEmoteOffsets(emotesTag);

  for (const word of words) {
    if (!word) continue;

    const isLast = words.length - 1 === i;

    while (true) {
      if (!isSelf) {
        const emoteId = emoteOffsets[offset];

        if (emoteId) {
          messageParts.push({
            type: MessagePartType.TWITCH_EMOTE,
            content: { id: emoteId, modifiers: [] },
          });

          break;
        }
      }

      if (isSelf) {
        const twitchEmoteId = emotes.twitch?.names[word];

        if (twitchEmoteId) {
          messageParts.push({
            type: MessagePartType.TWITCH_EMOTE,
            content: { id: twitchEmoteId, modifiers: [] },
          });

          break;
        }
      }

      const bttvEmoteId =
        emotes.bttvChannel?.names[word] || emotes.bttvGlobal?.names[word];

      if (bttvEmoteId) {
        const bttvEmote =
          emotes.bttvChannel?.entries[bttvEmoteId] ||
          emotes.bttvGlobal?.entries[bttvEmoteId];
        const isModifier = !!isEmoteModifier(
          bttvEmote!.code,
          MessagePartType.BTTV_EMOTE,
        );

        const part: MessagePart = {
          type: MessagePartType.BTTV_EMOTE,
          content: { id: bttvEmoteId, modifiers: [] },
        };

        if (isModifier) {
          addEmoteModifier(messageParts, part);
        } else {
          messageParts.push(part);
        }

        break;
      }

      const ffzEmoteId =
        emotes.ffzChannel?.names[word] || emotes.ffzGlobal?.names[word];

      if (ffzEmoteId) {
        const isModifier = !!isEmoteModifier(
          ffzEmoteId,
          MessagePartType.FFZ_EMOTE,
        );

        const part: MessagePart = {
          type: MessagePartType.FFZ_EMOTE,
          content: { id: ffzEmoteId, modifiers: [] },
        };

        if (isModifier) {
          addEmoteModifier(messageParts, part);
        } else {
          messageParts.push(part);
        }

        break;
      }

      const stvEmoteId =
        emotes.stvChannel?.names[word] || emotes.stvGlobal?.names[word];

      if (stvEmoteId) {
        const stvEmote =
          emotes.stvChannel?.entries[stvEmoteId] ||
          emotes.stvGlobal?.entries[stvEmoteId];
        const isModifier = !!isEmoteModifier(
          stvEmote!,
          MessagePartType.STV_EMOTE,
        );

        const part: MessagePart = {
          type: MessagePartType.STV_EMOTE,
          content: { id: stvEmoteId, modifiers: [] },
        };

        if (isModifier) {
          addEmoteModifier(messageParts, part);
        } else {
          messageParts.push(part);
        }

        break;
      }

      const emojiId = emotes.emoji?.names[word];

      if (emojiId) {
        messageParts.push({
          type: MessagePartType.EMOJI,
          content: { id: emojiId, modifiers: [] },
        });

        break;
      }

      let m = word.match(MENTION_REGEX);

      if (m) {
        const [, displayText, target, tail] = m;

        messageParts.push({
          type: MessagePartType.MENTION,
          content: {
            displayText: displayText as string,
            recipient: target!.toLowerCase(),
          },
        });

        if (tail) {
          messageParts.push({
            type: MessagePartType.TEXT,
            content: tail,
          });
        }

        break;
      }

      m = word.match(LINK_REGEX);

      if (m && m[0].length === word.length) {
        const [link] = m;

        messageParts.push({
          type: MessagePartType.LINK,
          content: { displayText: link, url: link },
        });

        break;
      }

      const lastPart = messageParts.at(-1);

      if (lastPart?.type === MessagePartType.TEXT) {
        lastPart.content += word;
      } else {
        messageParts.push({
          type: MessagePartType.TEXT,
          content: word,
        });
      }

      break;
    }

    if (!isLast) {
      const lastPart = messageParts.at(-1);

      if (lastPart?.type === MessagePartType.TEXT) {
        if (lastPart.content !== ' ') lastPart.content += ' ';
      } else {
        messageParts.push({
          type: MessagePartType.TEXT,
          content: ' ',
        });
      }
    }

    i += 1;
    offset += getCodePointsCount(word) + 1;
  }

  return messageParts;
};

export default createMessageParts;
