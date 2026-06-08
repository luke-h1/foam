import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { View } from 'react-native';
import type { EmoteMenuProvider } from '../constants/emoteMenuSections';
import { EmoteMenuIcon } from './EmoteMenuIcon';
import { emoteSheetStyles as styles } from '../emoteSheetStyles';

interface ProviderChipProps {
  isActive: boolean;
  onPress: () => void;
  provider: EmoteMenuProvider;
}

export function ProviderChip({
  isActive,
  onPress,
  provider,
}: ProviderChipProps) {
  return (
    <Button
      style={[styles.providerChip, isActive && styles.providerChipActive]}
      onPress={onPress}
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
