import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

const useChangeScreenOrientation = () => {
  useEffect(() => {
    async function changeScreenOrientation() {
      await ScreenOrientation.unlockAsync();

      const subscription = ScreenOrientation.addOrientationChangeListener(
        event => {
          // eslint-disable-next-line no-console
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

    changeScreenOrientation();
  }, []);
};

export default useChangeScreenOrientation;
