import { createElement, type ReactNode } from 'react';
import { View } from 'react-native';

/**
 * KeyboardAwareLegendList virtualizes natively and renders nothing under jest;
 * render every item through renderItem so list content is assertable in tests.
 * `createElement` (not JSX) sidesteps react-native-boost's JSX transform,
 * which reads `Platform.OS` at import time and breaks under jest here.
 */
export function KeyboardAwareLegendList<TItem>({
  data,
  renderItem,
  keyExtractor,
}: {
  data: TItem[];
  renderItem: (info: { item: TItem; index: number }) => ReactNode;
  keyExtractor: (item: TItem, index: number) => string;
}) {
  return createElement(
    View,
    null,
    data.map((item, index) =>
      createElement(
        View,
        { key: keyExtractor(item, index) },
        renderItem({ item, index }),
      ),
    ),
  );
}

export function useKeyboardChatComposerInset() {
  return {
    contentInsetEndAdjustment: { value: 0 },
    onComposerLayout: jest.fn(),
  };
}

export function useKeyboardScrollToEnd() {
  return {
    freeze: { value: false },
    scrollMessageToEnd: jest.fn(),
  };
}
