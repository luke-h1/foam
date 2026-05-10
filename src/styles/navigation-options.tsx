import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { Color } from './pallete';

export function useLargeHeaderOptions(): NativeStackNavigationOptions {
  const isGlassAvailable = isLiquidGlassAvailable();

  return {
    headerTintColor: Color.grayscale[950],
    headerTransparent: true,
    headerBlurEffect: !isGlassAvailable ? 'dark' : undefined,
    headerLargeStyle: {
      backgroundColor: 'transparent',
    },
    headerLargeTitle: true,
  };
}
