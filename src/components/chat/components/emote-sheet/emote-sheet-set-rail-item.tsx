import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

import type { EmoteMenuSet } from '@app/components/chat/components/emote-sheet/util/emote-menu-data';

import { SetRailButton } from './set-rail-button';

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
      onScrollToSet={onScrollToSet}
      set={set}
    />
  );
}
