export function channelPointsRewardTitleFromSystemMsg(
  systemMsg: string,
): string | undefined {
  const line = systemMsg.trim();
  const redeemedMarker = 'redeemed ';
  const redeemedIndex = line.toLowerCase().indexOf(redeemedMarker);

  if (redeemedIndex === -1) {
    return undefined;
  }

  const title = line.slice(redeemedIndex + redeemedMarker.length).trim();
  return title || undefined;
}
