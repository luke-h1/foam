import { use, useMemo } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderHeightContext } from 'expo-router/react-navigation';

const COMPACT_HEADER_HEIGHT = 44;

interface HeaderInsetBaseStyle extends ViewStyle {
  paddingHorizontal?: number;
}

export function useHeaderInsetContentStyle(
  baseStyle: HeaderInsetBaseStyle,
): StyleProp<ViewStyle> {
  const insets = useSafeAreaInsets();
  const headerHeight =
    use(HeaderHeightContext) ?? insets.top + COMPACT_HEADER_HEIGHT;

  const baseHorizontalPadding = baseStyle.paddingHorizontal ?? 0;

  return useMemo(
    () => [
      baseStyle,
      Platform.OS === 'ios' && {
        paddingLeft: baseHorizontalPadding + insets.left,
        paddingRight: baseHorizontalPadding + insets.right,
        paddingTop: headerHeight,
      },
    ],
    [baseStyle, baseHorizontalPadding, headerHeight, insets.left, insets.right],
  );
}
