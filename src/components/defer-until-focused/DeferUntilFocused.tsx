import { type ReactNode, useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

interface DeferUntilFocusedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Native tabs mount every tab eagerly.
export function DeferUntilFocused({
  children,
  fallback = null,
}: DeferUntilFocusedProps) {
  const [hasFocused, setHasFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHasFocused(true);
    }, []),
  );

  if (!hasFocused) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
