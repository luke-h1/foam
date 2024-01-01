import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import logger from '../utils/logger';

const useChangeScreenOrientation = () => {
  useEffect(() => {
    async function changeScreenOrientation() {
      await ScreenOrientation.unlockAsync();

      const subscription = ScreenOrientation.addOrientationChangeListener(
        event => {
          logger.info(
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
