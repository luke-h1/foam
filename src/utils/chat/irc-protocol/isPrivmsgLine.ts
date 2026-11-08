import {
  skipLeadingWhitespace,
  skipSpaces,
} from '@app/utils/chat/irc-protocol/parseIrcMessage';

const AT_SIGN = 64;
const COLON = 58;

/**
 * Steps past an optional leading section that starts with `marker` and ends at
 * the next space, plus the spaces after it. Returns -1 when the section never
 * closes, which means the line is malformed.
 */
function skipSection(line: string, from: number, marker: number): number {
  if (from === -1 || line.charCodeAt(from) !== marker) {
    return from;
  }

  const spaceIndex = line.indexOf(' ', from);
  return spaceIndex === -1 ? -1 : skipSpaces(line, spaceIndex + 1, line.length);
}

/**
 * A cheap PRIVMSG test that skips whitespace and sections the same way
 * `parseIrcMessage` does, without parsing the tags.
 */
export function isPrivmsgLine(line: string): boolean {
  const tagsEnd = skipSection(line, skipLeadingWhitespace(line), AT_SIGN);
  const commandStart = skipSection(line, tagsEnd, COLON);

  return commandStart !== -1 && line.startsWith('PRIVMSG ', commandStart);
}
