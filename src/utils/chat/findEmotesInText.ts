import type { SanitisedEmote } from '@app/types/emote';
import { getSortedEmoteNames } from '@app/utils/chat/findEmotesInText/getSortedEmoteNames';

export interface FindEmotesInTextReturn {
  emote: SanitisedEmote;
  start: number;
  end: number;
}

const DELIMITER_REGEX = /[\s,.!?()[\]{}<>:;'"\\|/]/;
const SYMBOL_ONLY_EMOTE_NAME = /^[^a-zA-Z0-9]+$/;

function isDelimiter(char: string): boolean {
  return DELIMITER_REGEX.test(char);
}

function isTwitchEmoteSite(site: SanitisedEmote['site']): boolean {
  return (
    site === 'Twitch Global' ||
    site === 'Twitch Channel' ||
    site === 'Twitch Subscriber'
  );
}

export function findEmotesInText(
  text: string,
  emoteMap: Map<string, SanitisedEmote>,
  sortedEmoteNames = getSortedEmoteNames(emoteMap),
): FindEmotesInTextReturn[] {
  if (!text || sortedEmoteNames.length === 0) {
    return [];
  }

  const foundEmotes: FindEmotesInTextReturn[] = [];
  let currentIndex = 0;

  const urlRanges: { start: number; end: number }[] = [];
  // Most chat tokens are not URLs — skip the global regex when impossible.
  if (text.includes('://')) {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    let urlMatch: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((urlMatch = urlPattern.exec(text)) !== null) {
      urlRanges.push({
        start: urlMatch.index,
        end: urlMatch.index + urlMatch[0].length,
      });
    }
  }

  function isWithinUrl(index: number): boolean {
    for (let i = 0; i < urlRanges.length; i += 1) {
      const range = urlRanges[i];
      if (range && index >= range.start && index < range.end) {
        return true;
      }
    }
    return false;
  }

  function isValidEmotePosition(
    index: number,
    emoteName: string,
    isTwitchEmote: boolean,
  ): boolean {
    if (isWithinUrl(index)) {
      return false;
    }

    const endIndex = index + emoteName.length;
    const hasValidStart =
      index === 0 || (index > 0 && isDelimiter(text.charAt(index - 1)));
    const hasValidEnd =
      endIndex === text.length || isDelimiter(text.charAt(endIndex));

    if (isTwitchEmote && SYMBOL_ONLY_EMOTE_NAME.test(emoteName)) {
      return hasValidStart && hasValidEnd;
    }

    if (isTwitchEmote) {
      return hasValidStart || hasValidEnd;
    }

    return hasValidStart && hasValidEnd;
  }

  while (currentIndex < text.length) {
    let found = false;

    // eslint-disable-next-line no-restricted-syntax
    for (const emoteName of sortedEmoteNames) {
      const emote = emoteMap.get(emoteName);
      if (!emote) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const isTwitchEmote = isTwitchEmoteSite(emote.site);

      if (isTwitchEmote) {
        if (
          text.startsWith(emoteName, currentIndex) &&
          isValidEmotePosition(currentIndex, emoteName, true)
        ) {
          foundEmotes.push({
            emote,
            start: currentIndex,
            end: currentIndex + emoteName.length,
          });
          currentIndex += emoteName.length;
          found = true;
          break;
        }
      } else {
        const startIndex = text.indexOf(emoteName, currentIndex);
        if (
          startIndex !== -1 &&
          isValidEmotePosition(startIndex, emoteName, false)
        ) {
          foundEmotes.push({
            emote,
            start: startIndex,
            end: startIndex + emoteName.length,
          });
          currentIndex = startIndex + emoteName.length;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      currentIndex += 1;
    }
  }

  return foundEmotes;
}
