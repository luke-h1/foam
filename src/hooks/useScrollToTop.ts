import { AppStackParamList } from '@app/navigators';
import {
  EventArg,
  NavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/core';
import * as React from 'react';
import type { ScrollView } from 'react-native';
import type { WebView } from 'react-native-webview';

type ScrollOptions = { x?: number; y?: number; animated?: boolean };

type ScrollableView =
  | { scrollToTop: () => void }
  | { scrollTo: (options: ScrollOptions) => void }
  | {
      scrollToOffset: (options: {
        offset?: number;
        animated?: boolean;
      }) => void;
    }
  | { scrollResponderScrollTo: (options: ScrollOptions) => void };

type ScrollableWrapper =
  | { getScrollResponder: () => React.ReactNode | ScrollView }
  | { getNode: () => ScrollableView }
  | ScrollableView;

function getScrollableNode(
  ref: React.RefObject<ScrollableWrapper> | React.RefObject<WebView>,
) {
  if (ref?.current == null) {
    return null;
  }

  if (
    'scrollToTop' in ref.current ||
    'scrollTo' in ref.current ||
    'scrollToOffset' in ref.current ||
    'scrollResponderScrollTo' in ref.current
  ) {
    // This is already a scrollable node.
    return ref.current;
  }
  if ('getScrollResponder' in ref.current) {
    // If the view is a wrapper like FlatList, SectionList etc.
    // We need to use `getScrollResponder` to get access to the scroll responder
    return ref.current.getScrollResponder();
  }
  if ('getNode' in ref.current) {
    // When a `ScrollView` is wraped in `Animated.createAnimatedComponent`
    // we need to use `getNode` to get the ref to the actual scrollview.
    // Note that `getNode` is deprecated in newer versions of react-native
    // this is why we check if we already have a scrollable node above.
    return ref.current.getNode();
  }
  return ref.current;
}

export function useScrollToTop(
  ref:
    | React.RefObject<ScrollableWrapper>
    | React.RefObject<WebView>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | React.Ref<any>,
  offset: number = 0,
) {
  const navigation = useNavigation();
  const route = useRoute();

  React.useEffect(() => {
    const tabNavigations: NavigationProp<AppStackParamList>[] = [];
    let currentNavigation = navigation;

    // If the screen is nested inside multiple tab navigators, we should scroll to top for any of them
    // So we need to find all the parent tab navigators and add the listeners there
    while (currentNavigation) {
      if (currentNavigation.getState()?.type === 'tab') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        tabNavigations.push(currentNavigation);
      }

      currentNavigation = currentNavigation.getParent();
    }

    if (tabNavigations.length === 0) {
      return;
    }

    const unsubscribers = tabNavigations.map(tab => {
      return tab.addListener(
        // We don't wanna import tab types here to avoid extra deps
        // in addition, there are multiple tab implementations
        // @ts-expect-error ignore for now
        'tabPress',
        (e: EventArg<'tabPress', true>) => {
          // We should scroll to top only when the screen is focused
          const isFocused = navigation.isFocused();

          // In a nested stack navigator, tab press resets the stack to first screen
          // So we should scroll to top only when we are on first screen
          const isFirst =
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            tabNavigations.includes(navigation) ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            navigation.getState()?.routes[0].key === route.key;

          // Run the operation in the next frame so we're sure all listeners have been run
          // This is necessary to know if preventDefault() has been called
          // eslint-disable-next-line no-undef
          requestAnimationFrame(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const scrollable = getScrollableNode(ref) as
              | ScrollableWrapper
              | WebView;

            if (isFocused && isFirst && scrollable && !e.defaultPrevented) {
              if ('scrollToTop' in scrollable) {
                scrollable.scrollToTop();
              } else if ('scrollTo' in scrollable) {
                scrollable.scrollTo({ y: offset, animated: true });
              } else if ('scrollToOffset' in scrollable) {
                scrollable.scrollToOffset({ offset, animated: true });
              } else if ('scrollResponderScrollTo' in scrollable) {
                scrollable.scrollResponderScrollTo({
                  y: offset,
                  animated: true,
                });
              } else if ('injectJavaScript' in scrollable) {
                scrollable.injectJavaScript(
                  `;window.scrollTo({ top: ${offset}, behavior: 'smooth' }); true;`,
                );
              }
            }
          });
        },
      );
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [navigation, ref, offset, route.key]);
}

export const useScrollRef =
  process.env.EXPO_OS === 'web'
    ? () => undefined
    : () => {
        const ref = React.useRef(null);

        useScrollToTop(ref);

        return ref;
      };
