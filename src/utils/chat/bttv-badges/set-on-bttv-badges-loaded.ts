import { onBadgesLoaded } from '@app/utils/chat/bttv-badges/on-badges-loaded';

export function setOnBttvBadgesLoaded(callback: () => void): void {
  onBadgesLoaded.current = callback;
}
