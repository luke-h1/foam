import { Button } from '@app/components/Button/Button';
import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';

import { emoteSheetStyles as styles } from './emoteSheetStyles';

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
      ) : set.icon.startsWith('avatar:') ? (
        <Image
          source={set.icon.slice(7)}
          style={styles.setRailAvatar}
          containerStyle={styles.setRailAvatarContainer}
          transition={100}
        />
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
