import { use, useMemo } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderHeightContext } from 'expo-router/react-navigation';

const COMPACT_HEADER_HEIGHT = 44;

export function useHeaderInsetContentStyle(
  baseStyle: ViewStyle,
): StyleProp<ViewStyle> {
  const { top: topInset } = useSafeAreaInsets();
  const headerHeight =
    use(HeaderHeightContext) ?? topInset + COMPACT_HEADER_HEIGHT;

  return useMemo(
    () => [baseStyle, Platform.OS === 'ios' && { paddingTop: headerHeight }],
    [baseStyle, headerHeight],
  );
}
