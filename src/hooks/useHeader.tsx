import Heading, { HeadingProps } from '@app/components/Heading';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';

/**
 * A hook to set the header for a screen.
 */
export function useHeader(headingProps: HeadingProps, deps: unknown[] = []) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => <Heading {...headingProps} />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
