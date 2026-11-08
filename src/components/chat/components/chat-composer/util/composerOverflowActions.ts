import type { SFSymbol } from 'sf-symbols-typescript';

export interface ComposerOverflowAction {
  disabled?: boolean;
  icon: SFSymbol;
  label: string;
  onPress: () => void;
}
