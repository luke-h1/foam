import type { SanitisedEmote } from '@app/types/emote';

export interface FindEmotesInTextReturn {
  emote: SanitisedEmote;
  start: number;
  end: number;
}

const DELIMITER_REGEX = /[\s,.!?()[\]{}<>:;'"\\]/;

export function getSortedEmoteNames(
  emoteMap: Map<string, SanitisedEmote>,
): string[] {
  return Array.from(emoteMap.keys()).sort((a, b) => b.length - a.length);
}

function isDelimiter(char: string): boolean {
  return DELIMITER_REGEX.test(char);
}

export function findEmotesInText(
  text: string,
  emoteMap: Map<string, SanitisedEmote>,
  sortedEmoteNames = getSortedEmoteNames(emoteMap),
): FindEmotesInTextReturn[] {
  const foundEmotes: FindEmotesInTextReturn[] = [];
  let currentIndex = 0;

  const urlRanges: { start: number; end: number }[] = [];
  const urlPattern = /https?:\/\/[^\s]+/gi;
  let urlMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((urlMatch = urlPattern.exec(text)) !== null) {
    urlRanges.push({
      start: urlMatch.index,
      end: urlMatch.index + urlMatch[0].length,
    });
  }

  function isWithinUrl(index: number): boolean {
    return urlRanges.some(range => index >= range.start && index < range.end);
  }

  function isValidEmotePosition(
    index: number,
    emoteName: string,
    isTwitchEmote: boolean,
  ): boolean {
    if (isWithinUrl(index)) {
      return false;
    }

    if (isTwitchEmote && /^[^a-zA-Z0-9]+$/.test(emoteName)) {
      const hasValidStart =
        index === 0 || (index > 0 && isDelimiter(text.charAt(index - 1)));
      const endIndex = index + emoteName.length;
      const hasValidEnd =
        endIndex === text.length || isDelimiter(text.charAt(endIndex));
      return hasValidStart && hasValidEnd;
    }

    const hasValidStart =
      index === 0 || (index > 0 && isDelimiter(text.charAt(index - 1)));
    const endIndex = index + emoteName.length;
    const hasValidEnd =
      endIndex === text.length || isDelimiter(text.charAt(endIndex));

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
      if (emote) {
        const isTwitchEmote =
          emote.site === 'Twitch Global' ||
          emote.site === 'Twitch Channel' ||
          emote.site === 'Twitch Subscriber';

        if (isTwitchEmote) {
          const exactMatch = text.slice(currentIndex).startsWith(emoteName);
          if (
            exactMatch &&
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
    }

    if (!found) {
      currentIndex += 1;
    }
  }

  return foundEmotes;
}
