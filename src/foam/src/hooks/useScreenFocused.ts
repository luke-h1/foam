import { use, useEffect, useState } from 'react';

import { NavigationContext } from 'expo-router/build/react-navigation/core';

export function useScreenFocused(): boolean {
  const navigation = use(NavigationContext);
  const [isFocused, setIsFocused] = useState(
    () => navigation?.isFocused() ?? true,
  );

  useEffect(() => {
    if (!navigation) {
      return;
    }

    const unsubscribeFocus = navigation.addListener('focus', () =>
      setIsFocused(true),
    );
    const unsubscribeBlur = navigation.addListener('blur', () =>
      setIsFocused(false),
    );

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return isFocused;
}
