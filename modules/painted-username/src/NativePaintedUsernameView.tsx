import { View } from 'react-native';

import type { NativePaintedUsernameViewProps } from './PaintedUsername.types';

/**
 * Non-iOS platforms use the JS MaskedView paint stack.
 */
export function NativePaintedUsernameView(_props: NativePaintedUsernameViewProps) {
  return <View />;
}

export const isNativePaintedUsernameAvailable = false;
