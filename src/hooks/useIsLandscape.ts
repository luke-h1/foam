import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export const useIsLandscape = () => {
  const [landscape, setLandscape] = useState(false);

  Dimensions.addEventListener('change', _ => {
    setLandscape(Dimensions.get('window').width > 500);
  });

  useEffect(() => {
    if (Dimensions.get('window').width > 500) {
      setLandscape(true);
    }
  }, []);

  return {
    landscape,
  };
};
