import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * The icon is only drawn on iOS; the Android sheet shows the label alone.
 */
export interface ComposerOverflowAction {
  disabled?: boolean;
  icon: SFSymbol;
  label: string;
  onPress: () => void;
}
