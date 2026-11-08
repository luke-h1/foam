import { onBadgesLoaded } from '@app/store/chat/actions/bttv-badges/onBadgesLoaded';

export function setOnBttvBadgesLoaded(callback: () => void): void {
  onBadgesLoaded.current = callback;
}
