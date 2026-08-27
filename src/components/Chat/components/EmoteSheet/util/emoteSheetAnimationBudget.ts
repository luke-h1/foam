type AnimationBudgetListener = (granted: boolean) => void;

/**
 * Caps concurrently animating picker cells; full autoplay caused a 3.8-4.6s
 * main-thread hang (Sentry FOAM-TV-MOBILE-W). Cells over the cap hold frame 1.
 */
export const MAX_CONCURRENT_ANIMATED = 96;

interface AnimationSlot {
  granted: boolean;
  listener: AnimationBudgetListener;
}

export interface EmoteSheetAnimationBudget {
  acquire: (listener: AnimationBudgetListener) => () => void;
  reset: () => void;
}

export function createAnimationBudget(
  maxConcurrent: number = MAX_CONCURRENT_ANIMATED,
): EmoteSheetAnimationBudget {
  const slots = new Set<AnimationSlot>();
  let grantedCount = 0;

  function grant(slot: AnimationSlot): void {
    if (slot.granted || grantedCount >= maxConcurrent) {
      return;
    }
    slot.granted = true;
    grantedCount += 1;
    slot.listener(true);
  }

  function promoteWaiting(): void {
    for (const slot of slots) {
      if (grantedCount >= maxConcurrent) {
        return;
      }
      grant(slot);
    }
  }

  return {
    acquire(listener: AnimationBudgetListener): () => void {
      const slot: AnimationSlot = { granted: false, listener };
      slots.add(slot);
      grant(slot);

      return () => {
        slots.delete(slot);
        if (slot.granted) {
          slot.granted = false;
          grantedCount -= 1;
          promoteWaiting();
        }
      };
    },
    reset(): void {
      // Unmounted cells' release closures still hold these slots; clearing
      // `granted` first stops late releases dropping `grantedCount` below zero.
      for (const slot of slots) {
        slot.granted = false;
      }
      slots.clear();
      grantedCount = 0;
    },
  };
}

export const emoteSheetAnimationBudget = createAnimationBudget();
