import { parseIrcTags } from '@app/utils/chat/ircProtocol/parseIrcTags';

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

  if (line.charCodeAt(cursor) === AT_SIGN) {
    const tagEnd = line.indexOf(' ', cursor);
    if (tagEnd === -1 || tagEnd >= end) {
      return null;
    }
    tags = parseIrcTags(line.slice(cursor + 1, tagEnd));
    cursor = tagEnd + 1;
    while (cursor < end && line.charCodeAt(cursor) === SPACE) {
      cursor += 1;
    }
  }

  if (line.charCodeAt(cursor) === COLON) {
    const prefixEnd = line.indexOf(' ', cursor);
    if (prefixEnd === -1 || prefixEnd >= end) {
      return null;
    }
    prefix = line.slice(cursor + 1, prefixEnd);
    cursor = prefixEnd + 1;
    while (cursor < end && line.charCodeAt(cursor) === SPACE) {
      cursor += 1;
    }
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

  if (trailingIndex >= 0) {
    const leading = paramString.slice(0, trailingIndex);
    if (leading) {
      params.push(...leading.split(' '));
    }
    params.push(paramString.slice(trailingIndex + 2));
  } else if (paramString.startsWith(':')) {
    params.push(paramString.slice(1));
  } else if (paramString) {
    params.push(...paramString.split(' '));
  }

  return { tags, prefix, command, params };
}
