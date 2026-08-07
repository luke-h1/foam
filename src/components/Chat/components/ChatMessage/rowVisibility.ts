import { createContext, useCallback, useState } from 'react';

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
  const [store] = useState(createRowVisibilityStore);
  useViewability(
    useCallback(token => store.setVisible(token.isViewable), [store]),
  );
  return store;
}
