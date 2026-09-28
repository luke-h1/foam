import { parseIrcTags } from '@app/utils/chat/irc-protocol/parse-irc-tags';

export interface IrcMessage {
  tags?: Record<string, string>;
  prefix?: string;
  command: string;
  params: string[];
}

const SPACE = 32;
const AT_SIGN = 64;
const COLON = 58;

/**
 * Parse a raw Twitch IRC line into its parts; null for invalid lines.
 * Cursor-based on purpose - the old per-stage tail copies cost per message in a busy channel.
 */
/**
 * Index of the next non-space character, so a run of separators is skipped in
 * one step.
 */
function skipSpaces(line: string, from: number, end: number): number {
  let cursor = from;

  while (cursor < end && line.charCodeAt(cursor) === SPACE) {
    cursor += 1;
  }

  return cursor;
}

export function parseIrcMessage(line: string): IrcMessage | null {
  let cursor = 0;
  let end = line.length;

  while (cursor < end && line.charCodeAt(cursor) <= SPACE) {
    cursor += 1;
  }

  while (end > cursor && line.charCodeAt(end - 1) <= SPACE) {
    end -= 1;
  }

  if (cursor >= end) {
    return null;
  }

  let tags: Record<string, string> | undefined;
  let prefix: string | undefined;

  const tagEnd =
    line.charCodeAt(cursor) === AT_SIGN ? line.indexOf(' ', cursor) : null;

  // A tag block that never closes means the line is truncated.
  if (tagEnd !== null && (tagEnd === -1 || tagEnd >= end)) {
    return null;
  }

  if (tagEnd !== null) {
    tags = parseIrcTags(line.slice(cursor + 1, tagEnd));
    cursor = skipSpaces(line, tagEnd + 1, end);
  }

  const prefixEnd =
    line.charCodeAt(cursor) === COLON ? line.indexOf(' ', cursor) : null;

  if (prefixEnd !== null && (prefixEnd === -1 || prefixEnd >= end)) {
    return null;
  }

  if (prefixEnd !== null) {
    prefix = line.slice(cursor + 1, prefixEnd);
    cursor = skipSpaces(line, prefixEnd + 1, end);
  }

  const commandEnd = line.indexOf(' ', cursor);
  const hasParams = commandEnd !== -1 && commandEnd < end;

  const command = hasParams
    ? line.slice(cursor, commandEnd)
    : line.slice(cursor, end);

  if (!command) {
    return null;
  }

  const params: string[] = [];
  const paramString = hasParams ? line.slice(commandEnd + 1, end) : '';
  const trailingIndex = paramString.indexOf(' :');

  const leading = trailingIndex >= 0 ? paramString.slice(0, trailingIndex) : '';

  if (leading) {
    params.push(...leading.split(' '));
  }

  if (trailingIndex >= 0) {
    params.push(paramString.slice(trailingIndex + 2));
  } else if (paramString.startsWith(':')) {
    params.push(paramString.slice(1));
  } else if (paramString) {
    params.push(...paramString.split(' '));
  }

  return { tags, prefix, command, params };
}
