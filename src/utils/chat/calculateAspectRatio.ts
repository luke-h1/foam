export function calculateAspectRatio(
  width: number,
  height: number,
  desiredHeight: number,
) {
  const aspectRatio = width / height;
  const calculatedWidth = desiredHeight * aspectRatio;

  return {
    width: calculatedWidth,
    height: desiredHeight,
  };
}
