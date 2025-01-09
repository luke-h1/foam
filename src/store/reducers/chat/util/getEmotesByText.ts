import { AllEmotes, HtmlEmote } from '../types/emote';
import createHtmlEmote from './createHtmlEmote';
import { MessagePartType } from './messages/types/messages';

interface SearchResult {
  begins: HtmlEmote[];
  contains: HtmlEmote[];
}

function createFindEmotes<T, U extends keyof T, V extends keyof T>(
  emotes: AllEmotes,
  entries: Record<string, T> | undefined,
  nameProp: U,
  idProp: V,
  type: MessagePartType,
) {
  // eslint-disable-next-line func-names
  return function (result: SearchResult, search: string, limit: number) {
    if (!entries) {
      return false;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const emote of Object.values(entries)) {
      if (result.begins.length + result.contains.length === limit) {
        // eslint-disable-next-line consistent-return
        return true;
      }

      const index = (emote[nameProp] as unknown as string)
        .toLowerCase()
        .indexOf(search);

      if (index === -1) {
        // eslint-disable-next-line no-continue
        continue;
      }
      result[index === 0 ? 'begins' : 'contains'].push(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        createHtmlEmote(emotes, type, emote[idProp] as never)!,
      );
    }
    return false;
  };
}

function createFindEmoji(emotes: AllEmotes) {
  return function (result: SearchResult, search: string, limit: number) {
    if (!emotes.emoji?.entries) {
      return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const emote of Object.values(emotes.emoji.entries)) {
      if (result.begins.length + result.contains.length === limit) {
        // eslint-disable-next-line consistent-return
        return true;
      }

      if (typeof emote.name === 'string') {
        const index = emote.name.toLowerCase().indexOf(search);

        if (index === -1) {
          // eslint-disable-next-line no-continue
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
        // eslint-disable-next-line no-restricted-syntax
        for (const keyword of emote.name) {
          const index = keyword.toLowerCase().indexOf(search);

          if (index === -1) {
            // eslint-disable-next-line no-continue
            continue;
          }

          result[index === 0 ? 'begins' : 'contains'].push(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            createHtmlEmote(emotes, MessagePartType.EMOJI, emote.codePoints)!,
          );
          break;
        }
      }
    }
  };
}

export default function getEmotesByText(
  search: string,
  emotes: AllEmotes,
  limit = -1,
): HtmlEmote[] {
  const result: SearchResult = { begins: [], contains: [] };

  const emoteFinders = [
    createFindEmotes(
      emotes,
      emotes.twitch?.entries,
      'name',
      'id',
      MessagePartType.TWITCH_EMOTE,
    ),
    createFindEmotes(
      emotes,
      emotes.bttvChannel?.entries,
      'code',
      'id',
      MessagePartType.BTTV_EMOTE,
    ),
    createFindEmotes(
      emotes,
      emotes.bttvGlobal?.entries,
      'code',
      'id',
      MessagePartType.BTTV_EMOTE,
    ),
    createFindEmotes(
      emotes,
      emotes.ffzChannel?.entries,
      'name',
      'id',
      MessagePartType.FFZ_EMOTE,
    ),
    createFindEmotes(
      emotes,
      emotes.ffzGlobal?.entries,
      'name',
      'id',
      MessagePartType.FFZ_EMOTE,
    ),
    createFindEmotes(
      emotes,
      emotes.stvChannel?.entries,
      'name',
      'id',
      MessagePartType.STV_EMOTE,
    ),
    createFindEmotes(
      emotes,
      emotes.stvGlobal?.entries,
      'name',
      'id',
      MessagePartType.STV_EMOTE,
    ),
    createFindEmoji(emotes),
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isOver = emoteFinders.some(findEmote =>
    findEmote(result, search, limit),
  );

  return [...result.begins, ...result.contains];
}
