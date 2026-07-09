import { createContext, useContext } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import type { PaintData } from '@app/types/seventv/cosmetics';

import type { PaintDropShadowMode } from './util/paintLayer';

export interface PaintedUsernameRenderContextValue {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  sevenTvPaintDropShadows: PaintDropShadowMode;
  usernameTextStyle?: StyleProp<TextStyle>;
}

const PaintedUsernameRenderContext =
  createContext<PaintedUsernameRenderContextValue | null>(null);

export function PaintedUsernameRenderProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PaintedUsernameRenderContextValue;
}) {
  return (
    <PaintedUsernameRenderContext.Provider value={value}>
      {children}
    </PaintedUsernameRenderContext.Provider>
  );
}

export function usePaintedUsernameRenderContext(): PaintedUsernameRenderContextValue | null {
  return useContext(PaintedUsernameRenderContext);
}
