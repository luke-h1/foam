import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { logger } from '@app/utils/logger';

const VISIBLE_ASSET_HYDRATION_DELAY_MS = 150;

type VisibleAssetHydrationState = {
  hydratedMessageKeys: Set<string>;
  personalEmoteUsers: Set<string>;
  cosmeticUsers: Set<string>;
  pendingMessages: AnyChatMessageType[];
  epoch: number;
  timer: ReturnType<typeof setTimeout> | null;
  activePass: Promise<void> | null;
};

export const visibleAssetHydration: VisibleAssetHydrationState = {
  hydratedMessageKeys: new Set(),
  personalEmoteUsers: new Set(),
  cosmeticUsers: new Set(),
  pendingMessages: [],
  epoch: 0,
  timer: null,
  activePass: null,
};

function clearVisibleAssetHydrationTimer(): void {
  if (visibleAssetHydration.timer) {
    clearTimeout(visibleAssetHydration.timer);
    visibleAssetHydration.timer = null;
  }
}

export function invalidateVisibleAssetHydrationPass(): void {
  visibleAssetHydration.epoch += 1;
  clearVisibleAssetHydrationTimer();
}

export function clearVisibleAssetHydration(): void {
  visibleAssetHydration.hydratedMessageKeys.clear();
  visibleAssetHydration.personalEmoteUsers.clear();
  visibleAssetHydration.cosmeticUsers.clear();
  visibleAssetHydration.pendingMessages = [];
  invalidateVisibleAssetHydrationPass();
}

export function scheduleVisibleAssetHydrationPass(
  runPass: (epoch: number) => Promise<void> | undefined,
): void {
  if (visibleAssetHydration.timer) {
    return;
  }

  const epoch = visibleAssetHydration.epoch;

  visibleAssetHydration.timer = setTimeout(() => {
    visibleAssetHydration.timer = null;

    const previousPass = visibleAssetHydration.activePass ?? Promise.resolve();

    const pass = previousPass
      .then(() => {
        if (visibleAssetHydration.epoch !== epoch) {
          return undefined;
        }

        return runPass(epoch);
      })
      .catch(error => {
        logger.chat.debug('Visible-asset hydration pass failed:', error);
      });

    visibleAssetHydration.activePass = pass;

    void pass.then(() => {
      if (visibleAssetHydration.activePass === pass) {
        visibleAssetHydration.activePass = null;
      }
    });
  }, VISIBLE_ASSET_HYDRATION_DELAY_MS);
}
