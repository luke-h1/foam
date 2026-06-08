import type { LegendListRenderItemProps } from '@legendapp/list';

import { ProviderChip } from './ProviderChip';
import type {
  EmoteMenuProvider,
  EmoteMenuProviderId,
} from '../constants/emoteMenuSections';

export interface ProviderListExtra {
  activeProviderId: EmoteMenuProviderId;
  onProviderPress: (id: EmoteMenuProviderId) => void;
}

export function renderProviderChip({
  item: provider,
  extraData,
}: LegendListRenderItemProps<EmoteMenuProvider>) {
  const { activeProviderId, onProviderPress }: ProviderListExtra = extraData;
  return (
    <ProviderChip
      isActive={provider.id === activeProviderId}
      onPress={() => onProviderPress(provider.id)}
      provider={provider}
    />
  );
}
