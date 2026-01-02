/* eslint-disable no-nested-ternary */
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

interface Props extends ViewProps {
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  avoidTabBar?: boolean; // New prop to control tab bar avoidance
}

/**
 * USE THIS - Alternative to the default [SafeAreaView](https://github.com/th3rdwave/react-native-safe-area-context#safeareaview)
 * from react-native-safe-area-context which currently has an issue that will cause a flicker / jump on first render on iOS / Android.
 *
 * [SafeAreaProvider](https://github.com/th3rdwave/react-native-safe-area-context#safeareaprovider) should still be higher in the tree.
 *
 * GitHub issues:
 * [219](https://github.com/th3rdwave/react-native-safe-area-context/issues/219),
 * [226](https://github.com/th3rdwave/react-native-safe-area-context/issues/226)
 */

function useTabBarHeight() {
  let tabHeight = 0;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabHeight = useBottomTabBarHeight();
  } catch {
    /* Not in a tab navigator context */
  }
  return tabHeight;
}

export function SafeAreaViewFixed({
  children,
  style,
  edges,
  avoidTabBar = false,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const dynamicTabBarHeight = useTabBarHeight();
  const {
    theme: {
      spacing: { tabBarHeight: themeTabBarHeight },
    },
  } = useUnistyles();
  // Use dynamic height if available, fall back to theme value
  const tabBarHeight = dynamicTabBarHeight || themeTabBarHeight;
  const defaultEdges = edges === undefined;

  return (
    <View
      style={[
        {
          paddingTop:
            defaultEdges || edges?.includes('top') ? insets.top : undefined,
          paddingBottom: avoidTabBar
            ? tabBarHeight // tabBarHeight from useBottomTabBarHeight already includes safe area
            : defaultEdges || edges?.includes('bottom')
              ? insets.bottom
              : undefined,
          paddingLeft:
            defaultEdges || edges?.includes('left') ? insets.left : undefined,
          paddingRight:
            defaultEdges || edges?.includes('right') ? insets.right : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
