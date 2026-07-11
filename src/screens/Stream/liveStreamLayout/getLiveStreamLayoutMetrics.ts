export function getLiveStreamLayoutMetrics({
  insetTop,
  windowHeight,
  windowWidth,
}: {
  insetTop: number;
  windowHeight: number;
  windowWidth: number;
}): {
  isLandscape: boolean;
  layoutHeight: number;
  portraitTopInset: number;
  screenHeight: number;
  screenWidth: number;
} {
  const resolvedWidth = Math.max(1, windowWidth);
  const resolvedHeight = Math.max(1, windowHeight);
  const isLandscape = resolvedWidth > resolvedHeight;
  const portraitTopInset = isLandscape ? 0 : insetTop;
  const screenHeight = resolvedHeight;
  const screenWidth = resolvedWidth;

  return {
    isLandscape,
    layoutHeight: Math.max(1, screenHeight - portraitTopInset),
    portraitTopInset,
    screenHeight,
    screenWidth,
  };
}
