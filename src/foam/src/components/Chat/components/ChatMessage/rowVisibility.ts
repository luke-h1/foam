import { createContext, useCallback, useRef } from 'react';

import { useViewability } from '@legendapp/list/react-native';

export type RowVisibilityListener = (isVisible: boolean) => void;

export interface RowVisibility {
  isVisible: () => boolean;
  subscribe: (listener: RowVisibilityListener) => () => void;
}

interface RowVisibilityStore extends RowVisibility {
  setVisible: (isVisible: boolean) => void;
}

export const RowVisibilityContext = createContext<RowVisibility | null>(null);

export function createRowVisibilityStore(
  initialVisible = true,
): RowVisibilityStore {
  let visible = initialVisible;
  const listeners = new Set<RowVisibilityListener>();
  return {
    isVisible: () => visible,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setVisible: next => {
      if (visible === next) {
        return;
      }
      visible = next;
      listeners.forEach(listener => listener(next));
    },
  };
}

export function useRowVisibility(): RowVisibility {
  const storeRef = useRef<RowVisibilityStore | null>(null);
  const store = (storeRef.current ??= createRowVisibilityStore());
  useViewability(
    useCallback(token => store.setVisible(token.isViewable), [store]),
  );
  return store;
}
