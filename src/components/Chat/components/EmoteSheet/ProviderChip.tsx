import { memo } from 'react';
import { View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import type {
  EmoteMenuProvider,
  EmoteMenuProviderId,
} from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { Text } from '@app/components/ui/Text/Text';

import { EmoteMenuIcon } from './EmoteMenuIcon';
import { emoteSheetStyles as styles } from './emoteSheetStyles';

interface ProviderChipProps {
  isActive: boolean;
  onSelect: (providerId: EmoteMenuProviderId) => void;
  provider: EmoteMenuProvider;
}

function ProviderChipComponent({
  isActive,
  onSelect,
  provider,
}: ProviderChipProps) {
  return (
    <Button
      haptic='selection'
      style={[styles.providerChip, isActive && styles.providerChipActive]}
      onPress={() => onSelect(provider.id)}
    >
      <View style={styles.providerChipIcon}>
        <EmoteMenuIcon
          icon={provider.icon}
          isActive={isActive}
          fallbackLabel={provider.title.slice(0, 2)}
        />
      </View>
      {isActive ? (
        <Text style={styles.providerChipTitle}>{provider.title}</Text>
      ) : null}
    </Button>
  );
}

export const ProviderChip = memo(ProviderChipComponent);
