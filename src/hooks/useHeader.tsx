import Heading, { HeadingProps } from '@app/components/Heading';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';

/**
 * A hook to set the header for a screen.
 */
export function useHeader(headingProps: HeadingProps, deps: any[] = []) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => <Heading {...headingProps} />,
    });
  }, deps);
}
