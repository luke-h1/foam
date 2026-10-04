import React from 'react';

const renderListSlot = (slot: React.ComponentType | React.ReactNode) =>
  slot instanceof Function ? React.createElement(slot) : slot;

export const FlashList = ({
  data = [],
  renderItem,
  ListHeaderComponent,
  ListEmptyComponent,
  ref,
  ...props
}: {
  data?: unknown[];
  renderItem?: (args: { item: unknown; index: number }) => React.ReactNode;
  ListHeaderComponent?: React.ComponentType | React.ReactNode;
  ListEmptyComponent?: React.ComponentType | React.ReactNode;
  ref?: React.Ref<unknown>;
}) =>
  React.createElement(
    'View',
    { ...props, ref },
    renderListSlot(ListHeaderComponent),
    data.length > 0
      ? data.map((item, index) =>
          React.createElement(
            React.Fragment,
            { key: String(index) },
            renderItem?.({ item, index }),
          ),
        )
      : renderListSlot(ListEmptyComponent),
  );

export const MasonryFlashList = FlashList;

export const useMappingHelper = () => ({
  getMappingKey: (key: string, index: number) => `${key}-${index}`,
});
