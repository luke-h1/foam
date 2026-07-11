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
