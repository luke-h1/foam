/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable func-names */
import { MessagePartType } from '../services/types/messages';
import { HtmlEmote, AllEmotes } from '../slices/emotes/types';
import createHtmlEmote from './createHtmlEmote';

interface SearchResult {
  begins: HtmlEmote[];
  contains: HtmlEmote[];
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function createFindEmotes<T, U extends keyof T, V extends keyof T>(
  emotes: AllEmotes,
  entries: Record<string, T> | undefined,
  nameProp: U,
  idProp: V,
  type: MessagePartType,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return function (result: SearchResult, search: string, limit: number) {
    if (!entries) {
      return;
    }

    for (const emote of Object.values(entries)) {
      if (result.begins.length + result.contains.length === limit) {
        return true;
      }

      const index = (emote[nameProp] as unknown as string)
        .toLowerCase()
        .indexOf(search);

      if (index === -1) {
        continue;
      }
      result[index === 0 ? 'begins' : 'contains'].push(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        createHtmlEmote(emotes, type, emote[idProp] as never)!,
      );
    }
  };
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function createFindEmoji(emotes: AllEmotes) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return function (result: SearchResult, search: string, limit: number) {
    if (!emotes.emoji?.entries) {
      return;
    }

    for (const emote of Object.values(emotes.emoji.entries)) {
      if (result.begins.length + result.contains.length === limit) {
        return true;
      }

      if (typeof emote.name === 'string') {
        const index = emote.name.toLowerCase().indexOf(search);

        if (index === -1) {
          continue;
        }

        result[index === 0 ? 'begins' : 'contains'].push(
          createHtmlEmote(
            emotes,
            MessagePartType.EMOJI,
            emote.codePoints,
          ) as HtmlEmote,
        );
      } else {
        for (const keyword of emote.name) {
          const index = keyword.toLowerCase().indexOf(search);

          if (index === -1) {
            continue;
          }

          result[index === 0 ? 'begins' : 'contains'].push(
            createHtmlEmote(emotes, MessagePartType.EMOJI, emote.codePoints)!,
          );
          break;
        }
      }
    }
  };
}

export default function getEmotesByText(
  _search: string,
  _emotes: AllEmotes,
  _limit = -1,
): HtmlEmote[] {
  const result: SearchResult = { begins: [], contains: [] };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  return [...result.begins, ...result.contains];
}
