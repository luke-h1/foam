import { useScrollToTop as useNavigationScrollToTop } from '@react-navigation/native';
import { Ref, RefObject, useMemo, useRef } from 'react';

type ScrollOptions = { x?: number; y?: number; animated?: boolean };
type WebScrollable = { injectJavaScript: (script: string) => void };

type ScrollableView =
  | { scrollToTop: () => void }
  | { scrollTo: (options: ScrollOptions) => void }
  | {
      scrollToOffset: (options: { offset: number; animated?: boolean }) => void;
    }
  | { scrollResponderScrollTo: (options: ScrollOptions) => void };

type ScrollableWrapper =
  | { getScrollResponder: () => ScrollableView | null }
  | { getNode: () => ScrollableView }
  | ScrollableView
  | null;

type ScrollableRef =
  | RefObject<ScrollableWrapper | WebScrollable>
  | Ref<ScrollableWrapper | WebScrollable>;

function isRefObject(
  ref: ScrollableRef,
): ref is RefObject<ScrollableWrapper | WebScrollable> {
  return typeof ref === 'object' && ref !== null && 'current' in ref;
}

function getScrollableNode(
  ref: ScrollableRef,
): ScrollableWrapper | WebScrollable {
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
  scrollable: ScrollableWrapper | WebScrollable,
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
