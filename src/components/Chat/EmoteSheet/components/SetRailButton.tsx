import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import type { EmoteMenuSet } from '../constants/emoteMenuSections';
import { emoteSheetStyles as styles } from '../emoteSheetStyles';

export function SetRailButton({
  isActive,
  onPress,
  set,
}: {
  isActive: boolean;
  onPress: () => void;
  set: EmoteMenuSet;
}) {
  return (
    <Button
      style={[styles.setRailButton, isActive && styles.setRailButtonActive]}
      onPress={onPress}
    >
      {set.icon.startsWith('emoji:') ? (
        <Text style={styles.setRailEmoji}>{set.icon.slice(6)}</Text>
      ) : (
        <Text
          style={[styles.setRailLabel, isActive && styles.setRailLabelActive]}
        >
          {set.shortLabel}
        </Text>
      )}
    </Button>
  );
}
