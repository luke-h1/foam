/**
 * The mention the send path puts in front of a reply. The composer counts it
 * against the message length limit.
 */
export function formatReplyPrefix(username: string): string {
  return `@${username} `;
}
