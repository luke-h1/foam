import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/icon/icon';
import type { SymbolViewProps } from '@app/components/ui/icon/icon';

export type RowIcon =
  | {
      color?: string;
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
