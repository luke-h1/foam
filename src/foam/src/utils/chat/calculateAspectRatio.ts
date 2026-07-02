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
