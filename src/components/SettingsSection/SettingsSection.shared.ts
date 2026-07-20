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

/**
 * Marker consumed by the Android Compose `SettingsSection` to place bespoke
 * Compose rows directly in the Card. No effect on iOS/web, which render
 * children as plain RN views.
 */
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
