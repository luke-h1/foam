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
  let lastPokeAt = 0;
  const listeners = new Set<ScrollActivityListener>();

  function setActive(next: boolean): void {
    if (active === next) {
      return;
    }

    active = next;
    listeners.forEach(listener => listener(next));
  }

  /**
   * Settles at `lastPokeAt + SETTLE_MS`. A fling pokes on every scroll tick,
   * so the timer waits out the remainder instead of being cleared and
   * re-armed sixty times a second.
   */
  function onSettleTimer(): void {
    const remainingMs = lastPokeAt + SETTLE_MS - Date.now();

    if (remainingMs > 0) {
      settleTimer = setTimeout(onSettleTimer, remainingMs);
      return;
    }

    settleTimer = null;
    setActive(false);
  }

  return {
    isActive: (): boolean => active,
    poke(): void {
      lastPokeAt = Date.now();
      setActive(true);

      if (settleTimer) {
        return;
      }

      settleTimer = setTimeout(onSettleTimer, SETTLE_MS);
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
