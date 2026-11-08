import { use, useMemo } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderHeightContext } from 'expo-router/react-navigation';

/**
 * Height of a compact native stack header below the status bar, used before
 * the navigator reports its real height.
 */
const COMPACT_HEADER_HEIGHT = 44;

/**
 * A list content style that clears the transparent iOS header. Android draws
 * an opaque header above the list, so it needs no padding.
 */
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
