import { useScrollToTop as useNavigationScrollToTop } from '@react-navigation/native';
import { Ref, RefObject, useMemo, useRef } from 'react';
import type { ScrollView } from 'react-native';
import type { WebView } from 'react-native-webview';

type ScrollOptions = { x?: number; y?: number; animated?: boolean };

type ScrollableView =
  | { scrollToTop: () => void }
  | { scrollTo: (options: ScrollOptions) => void }
  | {
      scrollToOffset: (options: { offset: number; animated?: boolean }) => void;
    }
  | { scrollResponderScrollTo: (options: ScrollOptions) => void };

type ScrollableWrapper =
  | { getScrollResponder: () => ScrollView | null }
  | { getNode: () => ScrollableView }
  | ScrollableView
  | null;

type ScrollableRef =
  | RefObject<ScrollableWrapper | WebView>
  | Ref<ScrollableWrapper | WebView>;

function isRefObject(
  ref: ScrollableRef,
): ref is RefObject<ScrollableWrapper | WebView> {
  return typeof ref === 'object' && ref !== null && 'current' in ref;
}

function getScrollableNode(ref: ScrollableRef): ScrollableWrapper | WebView {
  if (!isRefObject(ref) || ref.current == null) {
    return null;
  }

  const current = ref.current;

  if (
    'scrollToTop' in current ||
    'scrollTo' in current ||
    'scrollToOffset' in current ||
    'scrollResponderScrollTo' in current ||
    'injectJavaScript' in current
  ) {
    return current;
  }

  if ('getScrollResponder' in current) {
    return current.getScrollResponder();
  }

  if ('getNode' in current) {
    return current.getNode();
  }

  return current;
}

function scrollToOffset(
  scrollable: ScrollableWrapper | WebView,
  offset: number,
) {
  if (!scrollable) {
    return;
  }

  if ('scrollToTop' in scrollable && offset === 0) {
    scrollable.scrollToTop();
    return;
  }

  if ('scrollTo' in scrollable) {
    scrollable.scrollTo({ y: offset, animated: true });
    return;
  }

  if ('scrollToOffset' in scrollable) {
    scrollable.scrollToOffset({ offset, animated: true });
    return;
  }

  if ('scrollResponderScrollTo' in scrollable) {
    scrollable.scrollResponderScrollTo({
      y: offset,
      animated: true,
    });
    return;
  }

  if ('injectJavaScript' in scrollable) {
    scrollable.injectJavaScript(
      `;window.scrollTo({ top: ${offset}, behavior: 'smooth' }); true;`,
    );
  }
}

export function useScrollToTop(ref: ScrollableRef, offset: number = 0) {
  const scrollToTopRef = useMemo<RefObject<ScrollableView | null>>(
    () => ({
      get current() {
        const scrollable = getScrollableNode(ref);

        if (!scrollable) {
          return null;
        }

        return {
          scrollToTop: () => scrollToOffset(scrollable, offset),
        };
      },
    }),
    [ref, offset],
  );

  useNavigationScrollToTop(scrollToTopRef);
}

export const useScrollRef =
  process.env.EXPO_OS === 'web'
    ? () => undefined
    : () => {
        const ref = useRef<ScrollableWrapper>(null);

        useScrollToTop(ref);

        return ref;
      };
