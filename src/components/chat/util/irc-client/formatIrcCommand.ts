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

export function isSameIrcChannel(a: string, b: string): boolean {
  return (
    formatIrcChannelName(a).toLowerCase() ===
    formatIrcChannelName(b).toLowerCase()
  );
}
