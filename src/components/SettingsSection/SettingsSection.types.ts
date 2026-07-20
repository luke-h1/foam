import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/Icon/Icon';
import type { SymbolViewProps } from '@app/components/ui/Icon/Icon';

export type RowIcon =
  | {
      color?: string;
      icon: SFSymbol;
      androidIcon?: AndroidSymbol;
    }
  | undefined;

export interface ComposeRowComponent {
  isComposeRow?: boolean;
}

export function resolveIconName(
  icon: SFSymbol,
  androidIcon: AndroidSymbol | undefined,
): SymbolViewProps['name'] {
  if (!androidIcon) {
    return icon;
  }
  return { ios: icon, android: androidIcon, web: androidIcon };
}
