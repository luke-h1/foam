import { Orientation } from 'expo-screen-orientation';

export const isLandscape = (currentScreenOrientation: Orientation) => {
  if (
    currentScreenOrientation === Orientation.LANDSCAPE_LEFT ||
    currentScreenOrientation === Orientation.LANDSCAPE_RIGHT
  ) {
    return true;
  }
  return false;
};
