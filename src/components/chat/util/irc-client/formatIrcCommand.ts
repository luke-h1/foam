/**
 * Builds an IRC line from a command and its params. The last param becomes a
 * trailing `:param` when it holds a space, because IRC ends the line there.
 */
export function formatIrcCommand(command: string, params: string[]): string {
  const lastParam = params.at(-1);

  if (!lastParam) {
    return command;
  }

  const trailingParams = params.slice(0, -1).filter(Boolean);

  const head =
    trailingParams.length > 0
      ? `${command} ${trailingParams.join(' ')}`
      : command;

  return lastParam.includes(' ')
    ? `${head} :${lastParam}`
    : `${head} ${lastParam}`;
}

export function formatIrcChannelName(channelName: string): string {
  return channelName.startsWith('#') ? channelName : `#${channelName}`;
}

/**
 * Twitch channel names are case-insensitive, and a PART or JOIN echo may come
 * with or without the leading `#`.
 */
export function isSameIrcChannel(a: string, b: string): boolean {
  return (
    formatIrcChannelName(a).toLowerCase() ===
    formatIrcChannelName(b).toLowerCase()
  );
}
