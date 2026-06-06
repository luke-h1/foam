import { useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useState } from 'react';

interface DeferUntilFocusedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Native tabs mount every tab eagerly. Wrap a tab root in this so its
// heavy subtree is only mounted the first time the tab gains focus, then
// stays mounted (so subsequent tab switches are instant and state persists).
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
