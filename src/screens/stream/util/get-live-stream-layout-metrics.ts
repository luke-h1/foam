type LiveStreamLayoutMetrics = {
  isLandscape: boolean;
  layoutHeight: number;
  portraitTopInset: number;
  screenHeight: number;
  screenWidth: number;
};

export function getLiveStreamLayoutMetrics({
  insetTop,
  windowHeight,
  windowWidth,
}: {
  insetTop: number;
  windowHeight: number;
  windowWidth: number;
}): LiveStreamLayoutMetrics {
  const screenWidth = Math.max(1, windowWidth);
  const screenHeight = Math.max(1, windowHeight);
  const isLandscape = screenWidth > screenHeight;
  const portraitTopInset = isLandscape ? 0 : insetTop;

  return {
    isLandscape,
    layoutHeight: Math.max(1, screenHeight - portraitTopInset),
    portraitTopInset,
    screenHeight,
    screenWidth,
  };
}
