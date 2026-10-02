import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/icon/icon';
import type { SymbolViewProps } from '@app/components/ui/icon/icon';

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
