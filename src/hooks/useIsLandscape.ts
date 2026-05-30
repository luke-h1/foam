import { useObservable, useSelector } from '@legendapp/state/react';
import { useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useIsLandscape = () => {
  const landscape$ = useObservable(false);
  const landscape = useSelector(landscape$);

  useEffect(() => {
    const syncLandscape = () => {
      landscape$.set(Dimensions.get('window').width > 500);
    };

    syncLandscape();

    const subscription = Dimensions.addEventListener('change', syncLandscape);
    return () => {
      subscription.remove();
    };
  }, [landscape$]);

  return {
    landscape,
  };
};
