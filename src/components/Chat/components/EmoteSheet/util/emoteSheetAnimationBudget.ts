type AnimationBudgetListener = (granted: boolean) => void;

/**
 * Caps how many picker cells may animate at once.
 *
 * Every mounted cell autoplaying meant a reopened sheet committed ~100 animated
 * WebP layers in a single CoreAnimation transaction, decoding all of them on the
 * main thread (Sentry FOAM-TV-MOBILE-W, 3.8-4.6s fully-blocked hang). Cells
 * beyond the cap hold their first frame instead.
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
      // Cells unmount after the sheet dismisses, so their release closures still
      // hold these slots. Clearing `granted` first stops those late releases
      // from decrementing `grantedCount` below zero and doubling the cap.
      for (const slot of slots) {
        slot.granted = false;
      }
      slots.clear();
      grantedCount = 0;
    },
  };
}

export const emoteSheetAnimationBudget = createAnimationBudget();
