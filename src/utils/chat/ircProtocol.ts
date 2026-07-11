import { unescapeIrcTag } from './unescapeIrcTag';

export interface IrcMessage {
  tags?: Record<string, string>;
  prefix?: string;
  command: string;
  params: string[];
}

/**
 * Parse the `key=value;key2=value2` IRCv3 tag string into a map. Values may be
 * empty and may themselves contain `=`. Values are IRCv3-unescaped here so the
 * rest of the app never sees `\s`/`\:` escapes - this is the single place tags
 * are decoded, so downstream consumers must not unescape again (that would
 * corrupt values containing a literal backslash).
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
    // Split on the first `=` only (values may contain `=`) with two slices -
    // this runs ~20 times per message at up to 100 msg/s, and the previous
    // split/slice/join allocated three intermediates per tag.
    const equalsIndex = tagString.indexOf('=', start);
    const hasValue = equalsIndex !== -1 && equalsIndex < endIndex;
    const key = tagString.slice(start, hasValue ? equalsIndex : endIndex);

    if (key) {
      tags[key] = unescapeIrcTag(
        hasValue ? tagString.slice(equalsIndex + 1, endIndex) : '',
      );
    }

    if (separatorIndex === -1) {
      break;
    }
    start = separatorIndex + 1;
  }

  return tags;
}

/**
 * Cheap, allocation-free check for whether a raw IRC line is a PRIVMSG,
 * skipping the optional tag and prefix sections. Used to consult the flood
 * limiter before paying for the full ~20-tag parse - above the ingest cap
 * every dropped message previously cost a complete `parseIrcMessage`.
 * Tag values escape spaces as `\s` on the wire, so the first space reliably
 * ends each section.
 */
export function isPrivmsgLine(line: string): boolean {
  let index = 0;
  if (line.charCodeAt(index) === 64 /* @ */) {
    const spaceIndex = line.indexOf(' ', index);
    if (spaceIndex === -1) {
      return false;
    }
    index = spaceIndex + 1;
  }
  if (line.charCodeAt(index) === 58 /* : */) {
    const spaceIndex = line.indexOf(' ', index);
    if (spaceIndex === -1) {
      return false;
    }
    index = spaceIndex + 1;
  }
  return line.startsWith('PRIVMSG ', index);
}

/**
 * Escape a value for an outbound IRCv3 tag (the inverse of `unescapeIrcTag`):
 * `\`→`\\`, `;`→`\:`, space→`\s`, CR→`\r`, LF→`\n`. Backslashes are escaped
 * first so the later passes never double-escape their own output.
 */
function escapeIrcTagValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\:')
    .replace(/ /g, '\\s')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

/**
 * Build the outbound PRIVMSG line, optionally as a reply. Only
 * `reply-parent-msg-id` may be attached client→server: Twitch populates the
 * display-name/body reply tags itself on the broadcast side, and sending them
 * raw corrupts the line - the first space in a multi-word parent body
 * terminates the IRCv3 tag section, so the server reads the rest of the body
 * as the command and silently drops the reply.
 *
 * CR/LF in the message body are collapsed to a single space: IRC is
 * line-delimited, so an embedded newline (pasted multi-line text) would
 * otherwise terminate the PRIVMSG early and send the remainder as a raw IRC
 * command.
 */
export function buildPrivmsgLine({
  channel,
  message,
  replyParentMsgId,
}: {
  /**
   * Already formatted with its `#` prefix.
   */
  channel: string;
  message: string;
  replyParentMsgId?: string;
}): string {
  const command = replyParentMsgId
    ? `@reply-parent-msg-id=${escapeIrcTagValue(replyParentMsgId)} PRIVMSG`
    : 'PRIVMSG';
  return `${command} ${channel} :${message.replace(/[\r\n]+/g, ' ')}`;
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
