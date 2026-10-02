import type { SheetAction } from '@app/components/chat/components/sheet-action-group';

/**
 * The block, time-out and ban rows the message sheet and the user sheet both
 * offer, so the two sheets keep the same icon, label and tone.
 */
export function blockUserAction(onPress: () => void): SheetAction {
  return {
    icon: 'hand.raised',
    label: 'Block user',
    onPress,
    destructive: true,
  };
}

export function timeoutUserAction(onPress: () => void): SheetAction {
  return { icon: 'clock', label: 'Time out…', onPress };
}

export function banUserAction(onPress: () => void): SheetAction {
  return {
    icon: 'slash.circle',
    label: 'Ban user',
    onPress,
    destructive: true,
  };
}
