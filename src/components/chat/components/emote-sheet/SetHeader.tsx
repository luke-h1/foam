import { memo } from 'react';
import { View } from 'react-native';

import type { EmoteMenuSet } from '@app/components/chat/components/emote-sheet/util/emoteMenuData';
import { Text } from '@app/components/ui/text/Text';

import { EmoteMenuIcon } from './EmoteMenuIcon';
import { emoteSheetStyles as styles } from './EmoteSheet.styles';

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
      <Text
        type='callout'
        family='brand'
        numberOfLines={1}
        style={styles.setHeaderTitle}
      >
        {set.title}
      </Text>
    </View>
  );
}

export const SetHeader = memo(SetHeaderComponent);
