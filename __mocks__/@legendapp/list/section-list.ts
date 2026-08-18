import { createElement, type ReactNode } from 'react';
import { View } from 'react-native';

type MockSection<TItem> = { key: string; data: TItem[] };

/**
 * SectionList virtualizes natively; render every section header and item so
 * grouped list content is assertable in tests. `createElement` (not JSX)
 * sidesteps react-native-boost's JSX transform, which reads `Platform.OS` at
 * import time and breaks under jest here.
 */
export function SectionList<TItem>({
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
}: {
  sections: MockSection<TItem>[];
  renderItem: (info: { item: TItem; index: number }) => ReactNode;
  renderSectionHeader: (info: { section: MockSection<TItem> }) => ReactNode;
  keyExtractor: (item: TItem, index: number) => string;
}) {
  return createElement(
    View,
    null,
    sections.map(section =>
      createElement(View, { key: section.key }, [
        createElement(
          View,
          { key: `${section.key}-header` },
          renderSectionHeader({ section }),
        ),
        ...section.data.map((item, index) =>
          createElement(
            View,
            { key: keyExtractor(item, index) },
            renderItem({ item, index }),
          ),
        ),
      ]),
    ),
  );
}
