import { memo } from 'react';
import { View } from 'react-native';

import { Button } from '@app/components/button/button';
import type {
  EmoteMenuProvider,
  EmoteMenuProviderId,
} from '@app/components/chat/components/emote-sheet/util/emote-menu-data';
import { Text } from '@app/components/ui/text/text';

import { EmoteMenuIcon } from './emote-menu-icon';
import { emoteSheetStyles as styles } from './emote-sheet.styles';

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
      accessibilityLabel={provider.title}
      accessibilityState={{ selected: isActive }}
      haptic='selection'
      style={[styles.providerChip, isActive && styles.providerChipActive]}
      onPress={() => onSelect(provider.id)}
      testID={`emote-provider-${provider.id}`}
    >
      <View style={styles.providerChipIcon}>
        <EmoteMenuIcon
          icon={provider.icon}
          isActive={isActive}
          fallbackLabel={provider.title.slice(0, 2)}
        />
      </View>
      {isActive ? (
        <Text type='callout' family='brand' style={styles.providerChipTitle}>
          {provider.title}
        </Text>
      ) : null}
    </Button>
  );
}

export const ProviderChip = memo(ProviderChipComponent);
