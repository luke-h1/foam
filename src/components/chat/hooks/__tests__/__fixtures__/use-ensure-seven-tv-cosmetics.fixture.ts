import { chatStore$ } from '@app/store/chat/observables/chat-store';

interface CachedCosmeticsSeed {
  badgeId?: string;
  paintId?: string;
  twitchUserId: string;
}

export function setCachedCosmetics({
  badgeId,
  paintId,
  twitchUserId,
}: CachedCosmeticsSeed): void {
  if (paintId) {
    chatStore$.userPaintIds.set({ [twitchUserId]: paintId });
  }

  if (badgeId) {
    chatStore$.userBadgeIds.set({ [twitchUserId]: badgeId });
  }
}
