export function fitWithinMaxBox(
  width: number,
  height: number,
  maxSize: number,
) {
  const sourceWidth = width > 0 ? width : maxSize;
  const sourceHeight = height > 0 ? height : maxSize;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      width: maxSize,
      height: maxSize,
    };
  }

  const scale = Math.min(maxSize / sourceWidth, maxSize / sourceHeight);

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export function calculateAspectRatio(
  width: number,
  height: number,
  desiredHeight: number,
) {
  if (width === 0) {
    return {
      width: 0,
      height: desiredHeight,
    };
  }

  if (height <= 0 || width <= 0) {
    return {
      width: desiredHeight,
      height: desiredHeight,
    };
  }

  const aspectRatio = width / height;
  const calculatedWidth = desiredHeight * aspectRatio;

  return {
    width: calculatedWidth,
    height: desiredHeight,
  };
}
