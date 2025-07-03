import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

export const useChangeScreenOrientation = () => {
  useEffect(() => {
    async function changeScreenOrientation() {
      await ScreenOrientation.unlockAsync();

      const subscription = ScreenOrientation.addOrientationChangeListener(
        event => {
          console.info(
            'Orientation changed:',
            event.orientationInfo.orientation,
          );
        },
      );

      return () => {
        ScreenOrientation.removeOrientationChangeListener(subscription);
      };
    }

    void changeScreenOrientation();
  }, []);
};
