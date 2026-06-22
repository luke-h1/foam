import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';

import { SetRailButton } from './SetRailButton';

export interface SetRailListExtra {
  activeSetId: string;
  onScrollToSet: (setId: string) => void;
}

export function renderSetRailItem({
  item: set,
  extraData,
}: LegendListRenderItemProps<EmoteMenuSet>) {
  const { activeSetId, onScrollToSet }: SetRailListExtra = extraData;
  return (
    <SetRailButton
      isActive={set.id === activeSetId}
      onPress={() => onScrollToSet(set.id)}
      set={set}
    />
  );
}
