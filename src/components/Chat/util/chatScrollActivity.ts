type ScrollActivityListener = (active: boolean) => void;

const SETTLE_MS = 150;

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

/**
 * A single global signal the chat list pokes on every scroll tick. It marks the
 * list as actively scrolling and auto-settles after a short quiet window, so
 * animated emotes can stop decoding during a fling (the most CPU-contended
 * moment) and resume once it stops.
 */
export const chatScrollActivity = {
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
