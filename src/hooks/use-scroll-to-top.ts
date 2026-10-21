import type { Ref, RefObject } from 'react';

import { useScrollToTop as useNavigationScrollToTop } from 'expo-router';

type ScrollOptions = { x?: number; y?: number; animated?: boolean };
type WebScrollable = { injectJavaScript: (script: string) => void };

type ScrollToIndexParams = {
  index: number;
  animated?: boolean;
};

type ScrollableView =
  | {
      scrollToIndex: (params: ScrollToIndexParams) => void | Promise<void>;
    }
  | { scrollToTop: (params?: { animated?: boolean }) => void }
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
  return ref !== null && 'current' in ref;
}

function getScrollableNode(
  ref: ScrollableRef,
): ScrollableWrapper | WebScrollable {
  if (!isRefObject(ref) || ref.current == null) {
    return null;
  }

  const current = ref.current;

  if (
    'scrollToIndex' in current ||
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

  if ('scrollToIndex' in scrollable && offset === 0) {
    void scrollable.scrollToIndex({ index: 0, animated: true });
    return;
  }

  if ('scrollToTop' in scrollable && offset === 0) {
    scrollable.scrollToTop({ animated: true });
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
  // React Compiler can't lower an object-literal `get current()` accessor, so Object.defineProperty gives the same lazy semantics. `.current` must recompute when read - a tab re-press can land long after this render, once the scroll view has mounted.
  const scrollToTopRef: { current: { scrollToTop: () => void } | null } =
    Object.create(null);

  Object.defineProperty(scrollToTopRef, 'current', {
    enumerable: true,
    get: () => {
      const scrollable = getScrollableNode(ref);

      if (!scrollable) {
        return null;
      }

      return {
        scrollToTop: () => scrollToOffset(scrollable, offset),
      };
    },
  });

  useNavigationScrollToTop(scrollToTopRef);
}
