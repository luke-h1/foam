import { View } from 'react-native';

import type { NativePaintedUsernameViewProps } from './PaintedUsername.types';

/**
 * Android falls back to the JS MaskedView paint stack until a native renderer lands.
 */
export function NativePaintedUsernameView(_props: NativePaintedUsernameViewProps) {
  return <View />;
}

export const isNativePaintedUsernameAvailable = false;
