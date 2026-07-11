import type { SanitisedEmote } from '@app/types/emote';
import {
  type EmoteMatchEntry,
  getEmoteMatchIndex,
} from '@app/utils/chat/findEmotesInText/getEmoteMatchIndex';

export interface FindEmotesInTextReturn {
  emote: SanitisedEmote;
  start: number;
  end: number;
}

/**
 * ASCII delimiter bitmap matching /[\s,.!?()[\]{}<>:;'"\\|/]/.
 */
const DELIMITER_FLAGS = new Uint8Array(128);
for (const char of ' \t\n\r\f\v,.!?()[]{}<>:;\'"\\|/') {
  DELIMITER_FLAGS[char.charCodeAt(0)] = 1;
}

const EMPTY_CANDIDATES: EmoteMatchEntry[] = [];

function isDelimiter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code < 128 && DELIMITER_FLAGS[code] === 1;
}

function isSymbolOnlyEmoteName(name: string): boolean {
  for (let i = 0; i < name.length; i += 1) {
    const code = name.charCodeAt(i);
    const isAlphaNum =
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122);
    if (isAlphaNum) {
      return false;
    }
  }
  return name.length > 0;
}

export function findEmotesInText(
  text: string,
  emoteMap: Map<string, SanitisedEmote>,
  matchIndex = getEmoteMatchIndex(emoteMap),
): FindEmotesInTextReturn[] {
  if (!text || matchIndex.size === 0) {
    return [];
  }

  const foundEmotes: FindEmotesInTextReturn[] = [];
  let currentIndex = 0;

  const urlRanges: { start: number; end: number }[] = [];
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
    const hasValidStart = index === 0 || isDelimiter(text.charAt(index - 1));
    const hasValidEnd =
      endIndex === text.length || isDelimiter(text.charAt(endIndex));

    if (isTwitchEmote && isSymbolOnlyEmoteName(emoteName)) {
      return hasValidStart && hasValidEnd;
    }

    if (isTwitchEmote) {
      return hasValidStart || hasValidEnd;
    }

    return hasValidStart && hasValidEnd;
  }

  const { byFirstChar } = matchIndex;

  while (currentIndex < text.length) {
    let found = false;
    const candidates =
      byFirstChar.get(text.charAt(currentIndex)) ?? EMPTY_CANDIDATES;

    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i]!;
      if (
        text.startsWith(candidate.name, currentIndex) &&
        isValidEmotePosition(currentIndex, candidate.name, candidate.isTwitch)
      ) {
        foundEmotes.push({
          emote: candidate.emote,
          start: currentIndex,
          end: currentIndex + candidate.name.length,
        });
        currentIndex += candidate.name.length;
        found = true;
        break;
      }
    }

    if (!found) {
      currentIndex += 1;
    }
  }

  return foundEmotes;
}
