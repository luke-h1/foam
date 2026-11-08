import type { ReactNode } from 'react';

import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/icon/Icon';
import type { SymbolViewProps } from '@app/components/ui/icon/Icon';

/**
 * Row icons are monochrome glyphs, the same as the native iOS form. Colour is
 * kept for destructive rows only, which the row's `danger` flag sets.
 */
export type RowIcon =
  | {
      icon: SFSymbol;
      androidIcon?: AndroidSymbol;
    }
  | undefined;

export function resolveIconName(
  icon: SFSymbol,
  androidIcon: AndroidSymbol | undefined,
): SymbolViewProps['name'] {
  if (!androidIcon) {
    return icon;
  }

  return { ios: icon, android: androidIcon, web: androidIcon };
}

export interface SettingsOption<Value> {
  label: string;
  value: Value;
}

/**
 * The position of `value` in an options table. A value the table does not
 * hold, such as one an older build wrote, falls back to the first option.
 */
export function getOptionIndex<Value>(
  options: readonly SettingsOption<NoInfer<Value>>[],
  value: Value,
): number {
  return Math.max(
    0,
    options.findIndex(option => option.value === value),
  );
}

export interface SettingsSectionProps {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  cardColor?: string;
}

export interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;

  /**
   * A pressable row shows a chevron unless this is false. Action rows that
   * run in place, rather than open a screen, turn it off.
   */
  chevron?: boolean;
}

export interface SettingsToggleRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export interface SettingsLinkRowProps {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export interface SettingsSegmentedRowProps<Value> {
  title: string;
  subtitle?: string;
  icon?: RowIcon;
  options: readonly SettingsOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
}
