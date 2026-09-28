import { memo } from 'react';
import { View } from 'react-native';

import type { EmoteMenuSet } from '@app/components/chat/components/emote-sheet/util/emote-menu-data';
import { Text } from '@app/components/ui/text/text';

import { EmoteMenuIcon } from './emote-menu-icon';
import { emoteSheetStyles as styles } from './emote-sheet.styles';

function SetHeaderComponent({ set }: { set: EmoteMenuSet }) {
  return (
    <View style={styles.setHeader}>
      <View style={styles.setHeaderIcon}>
        <EmoteMenuIcon
          icon={set.icon}
          isActive
          fallbackLabel={set.shortLabel}
        />
      </View>
      <Text numberOfLines={1} style={styles.setHeaderTitle}>
        {set.title}
      </Text>
    </View>
  );
}

export const SetHeader = memo(SetHeaderComponent);
