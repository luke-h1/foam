import { createElement, type ReactNode } from 'react';
import { View } from 'react-native';

/**
 * LegendList virtualizes natively and renders nothing under jest; render
 * every item through renderItem so list content is assertable in tests.
 * `createElement` (not JSX) sidesteps react-native-boost's JSX transform,
 * which reads `Platform.OS` at import time and breaks under jest here.
 */
export function LegendList<TItem>({
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

export function useViewability() {}
