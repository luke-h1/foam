import { Orientation } from 'expo-screen-orientation';

import { isLandscape } from '../isLandscape';

describe('isLandscape()', () => {
  test('should return true when device is in landscape mode (left)', () => {
    expect(isLandscape(Orientation.LANDSCAPE_LEFT)).toBeTruthy();
  });
  test('should return true when device is in landscape mode (right)', () => {
    expect(isLandscape(Orientation.LANDSCAPE_RIGHT)).toBeTruthy();
  });
  test('should return false when device is in portrait mode', () => {
    expect(isLandscape(Orientation.PORTRAIT_UP)).toBeFalsy();
    expect(isLandscape(Orientation.PORTRAIT_DOWN)).toBeFalsy();
  });
});
