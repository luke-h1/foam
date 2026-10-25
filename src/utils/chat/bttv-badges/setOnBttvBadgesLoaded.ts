import { onBadgesLoaded } from '@app/utils/chat/bttv-badges/onBadgesLoaded';

export function setOnBttvBadgesLoaded(callback: () => void): void {
  onBadgesLoaded.current = callback;
}
