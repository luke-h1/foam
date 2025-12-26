import { navigationRef } from '@app/navigators/navigationUtilities';
import { ReactNode, Ref, RefObject, useEffect, useRef } from 'react';
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
  | { getScrollResponder: () => ReactNode | ScrollView }
  | { getNode: () => ScrollableView }
  | ScrollableView;

function getScrollableNode(
  ref: RefObject<ScrollableWrapper> | RefObject<WebView>,
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
    | RefObject<ScrollableWrapper>
    | RefObject<WebView>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Ref<any>,
  offset: number = 0,
) {
  useEffect(() => {
    // Check if navigation is ready before setting up listeners
    if (!navigationRef.isReady()) {
      return;
    }

    // Listen to navigation state changes to detect tab presses
    const unsubscribe = navigationRef.addListener('state', () => {
      if (!navigationRef.isReady()) {
        return;
      }

      // eslint-disable-next-line no-undef
      requestAnimationFrame(() => {
        const scrollable = getScrollableNode(
          ref as RefObject<ScrollableWrapper> | RefObject<WebView>,
        ) as ScrollableWrapper | WebView;

        if (scrollable) {
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
    });

    return () => {
      unsubscribe();
    };
  }, [ref, offset]);
}

export const useScrollRef =
  process.env.EXPO_OS === 'web'
    ? () => undefined
    : () => {
        const ref = useRef(null);

        useScrollToTop(ref);

        return ref;
      };
