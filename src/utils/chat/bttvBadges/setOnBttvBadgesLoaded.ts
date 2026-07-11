import { onBadgesLoaded } from '@app/utils/chat/bttvBadges/onBadgesLoaded';

export function setOnBttvBadgesLoaded(callback: () => void): void {
  onBadgesLoaded.current = callback;
}
