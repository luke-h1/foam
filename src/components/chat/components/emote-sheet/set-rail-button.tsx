import { memo } from 'react';

import { Button } from '@app/components/button/button';
import type { EmoteMenuSet } from '@app/components/chat/components/emote-sheet/util/emote-menu-data';
import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';

import { emoteSheetStyles as styles } from './emote-sheet.styles';

function SetRailIcon({
  isActive,
  set,
}: {
  isActive: boolean;
  set: EmoteMenuSet;
}) {
  if (set.icon.startsWith('emoji:')) {
    return <Text style={styles.setRailEmoji}>{set.icon.slice(6)}</Text>;
  }

  if (set.icon.startsWith('avatar:')) {
    return (
      <Image
        source={set.icon.slice(7)}
        cacheVariant='avatar'
        style={styles.setRailAvatar}
        containerStyle={styles.setRailAvatarContainer}
        transition={100}
      />
    );
  }

  return (
    <Text style={[styles.setRailLabel, isActive && styles.setRailLabelActive]}>
      {set.shortLabel}
    </Text>
  );
}

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
      <SetRailIcon isActive={isActive} set={set} />
    </Button>
  );
}

export const SetRailButton = memo(SetRailButtonComponent);
