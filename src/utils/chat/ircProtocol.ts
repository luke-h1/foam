export interface IrcMessage {
  tags?: Record<string, string>;
  prefix?: string;
  command: string;
  params: string[];
}

/**
 * Parse the `key=value;key2=value2` IRCv3 tag string into a map. Values may be
 * empty and may themselves contain `=`.
 */
export function parseIrcTags(tagString: string): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!tagString) {
    return tags;
  }

  let start = 0;
  while (start <= tagString.length) {
    const separatorIndex = tagString.indexOf(';', start);
    const endIndex = separatorIndex === -1 ? tagString.length : separatorIndex;
    const part = tagString.slice(start, endIndex);
    const keyValue = part.split('=');
    const key = keyValue[0] ?? '';

    if (key) {
      tags[key] = keyValue.length > 1 ? keyValue.slice(1).join('=') : '';
    }

    if (separatorIndex === -1) {
      break;
    }
    start = separatorIndex + 1;
  }

  return tags;
}

/**
 * Parse a raw Twitch IRC line (`[@tags] [:prefix] COMMAND params [:trailing]`)
 * into its parts. Returns null for blank or structurally invalid lines.
 */
export function parseIrcMessage(line: string): IrcMessage | null {
  if (!line.trim()) {
    return null;
  }

  let remaining = line.trim();
  let tags: Record<string, string> | undefined;
  let prefix: string | undefined;

  // Parse tags
  if (remaining.startsWith('@')) {
    const tagEnd = remaining.indexOf(' ');
    if (tagEnd === -1) {
      return null;
    }
    const tagString = remaining.substring(1, tagEnd);
    tags = parseIrcTags(tagString);
    remaining = remaining.substring(tagEnd + 1).trim();
  }

  // Parse prefix
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
