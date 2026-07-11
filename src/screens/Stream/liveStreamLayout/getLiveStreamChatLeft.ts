export function getLiveStreamChatLeft({
  chatWidth,
  isLandscape,
  screenWidth,
}: {
  chatWidth: number;
  isLandscape: boolean;
  screenWidth: number;
}): number {
  return isLandscape ? Math.max(0, screenWidth - chatWidth) : 0;
}
