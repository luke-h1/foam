import { memo } from 'react';
import { useColorScheme, View } from 'react-native';

import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';
import { Text } from '@app/components/ui/Text/Text';

import { EmoteMenuIcon } from './EmoteMenuIcon';
import { emoteSheetStyles } from './emoteSheetStyles';

function SetHeaderComponent({ set }: { set: EmoteMenuSet }) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const styles = emoteSheetStyles[scheme];
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
