import { Text } from '@app/components/ui/Text/Text';
import { View } from 'react-native';
import type { EmoteMenuSet } from '../constants/emoteMenuSections';
import { EmoteMenuIcon } from './EmoteMenuIcon';
import { emoteSheetStyles as styles } from '../emoteSheetStyles';

export function SetHeader({ set }: { set: EmoteMenuSet }) {
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
