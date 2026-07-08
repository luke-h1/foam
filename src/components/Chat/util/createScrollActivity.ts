type ScrollActivityListener = (active: boolean) => void;

const SETTLE_MS = 150;

export interface ScrollActivity {
  isActive: () => boolean;
  poke: () => void;
  reset: () => void;
  subscribe: (listener: ScrollActivityListener) => () => void;
}

export function createScrollActivity(): ScrollActivity {
  let active = false;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<ScrollActivityListener>();

  function setActive(next: boolean): void {
    if (active === next) {
      return;
    }
    active = next;
    listeners.forEach(listener => listener(next));
  }

  return {
    isActive: (): boolean => active,
    poke(): void {
      setActive(true);
      if (settleTimer) {
        clearTimeout(settleTimer);
      }
      settleTimer = setTimeout(() => {
        settleTimer = null;
        setActive(false);
      }, SETTLE_MS);
    },
    reset(): void {
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
      setActive(false);
    },
    subscribe(listener: ScrollActivityListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
