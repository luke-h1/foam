import { parseIrcTags } from '@app/utils/chat/ircProtocol/parseIrcTags';

export interface IrcMessage {
  tags?: Record<string, string>;
  prefix?: string;
  command: string;
  params: string[];
}

/**
 * Parse a raw Twitch IRC line (`[@tags] [:prefix] COMMAND params [:trailing]`)
 * into its parts. Returns null for blank or structurally invalid lines.
 */
export function parseIrcMessage(line: string): IrcMessage | null {
  let remaining = line.trim();
  if (!remaining) {
    return null;
  }

  let tags: Record<string, string> | undefined;
  let prefix: string | undefined;

  if (remaining.startsWith('@')) {
    const tagEnd = remaining.indexOf(' ');
    if (tagEnd === -1) {
      return null;
    }
    const tagString = remaining.substring(1, tagEnd);
    tags = parseIrcTags(tagString);
    remaining = remaining.substring(tagEnd + 1).trim();
  }

  if (remaining.startsWith(':')) {
    const prefixEnd = remaining.indexOf(' ');
    if (prefixEnd === -1) {
      return null;
    }
    prefix = remaining.substring(1, prefixEnd);
    remaining = remaining.substring(prefixEnd + 1).trim();
  }

  const commandEnd = remaining.indexOf(' ');
  const command =
    commandEnd === -1 ? remaining : remaining.slice(0, commandEnd);
  if (!command) {
    return null;
  }

  const params: string[] = [];
  const paramString = commandEnd === -1 ? '' : remaining.slice(commandEnd + 1);
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
