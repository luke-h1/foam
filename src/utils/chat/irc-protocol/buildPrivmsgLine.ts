/**
 * Escapes a value for an outbound IRCv3 tag (inverse of `unescapeIrcTag`);
 * backslashes go first so later passes never double-escape their own output.
 */
function escapeIrcTagValue(value: string): string {
  return value
    .replaceAll('\\', String.raw`\\`)
    .replaceAll(';', String.raw`\:`)
    .replaceAll(' ', String.raw`\s`)
    .replaceAll('\r', String.raw`\r`)
    .replaceAll('\n', String.raw`\n`);
}

export function buildPrivmsgLine({
  channel,
  message,
  replyParentMsgId,
}: {
  channel: string;
  message: string;
  replyParentMsgId?: string;
}): string {
  const command = replyParentMsgId
    ? `@reply-parent-msg-id=${escapeIrcTagValue(replyParentMsgId)} PRIVMSG`
    : 'PRIVMSG';
  return `${command} ${channel} :${message.replaceAll(/[\r\n]+/g, ' ')}`;
}
