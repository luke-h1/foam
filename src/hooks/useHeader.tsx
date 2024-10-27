import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';

/**
 * A hook to set the header for a screen.
 */
export function useHeader(headerProps: HeaderProps, deps: unknown[] = []) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => <Header {...headerProps} />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
