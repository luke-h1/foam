import { requireNativeViewManager } from 'expo-modules-core';

import type { NativePaintedUsernameViewProps } from './PaintedUsername.types';

export const NativePaintedUsernameView =
  requireNativeViewManager<NativePaintedUsernameViewProps>('PaintedUsername');

export const isNativePaintedUsernameAvailable = true;
