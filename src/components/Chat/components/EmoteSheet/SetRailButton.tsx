import { memo } from 'react';

import { Button } from '@app/components/Button/Button';
import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';

import { emoteSheetStyles as styles } from './emoteSheetStyles';

function SetRailButtonComponent({
  isActive,
  onScrollToSet,
  set,
}: {
  isActive: boolean;
  onScrollToSet: (setId: string) => void;
  set: EmoteMenuSet;
}) {
  return (
    <Button
      haptic='selection'
      style={[styles.setRailButton, isActive && styles.setRailButtonActive]}
      onPress={() => onScrollToSet(set.id)}
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

export const SetRailButton = memo(SetRailButtonComponent);
