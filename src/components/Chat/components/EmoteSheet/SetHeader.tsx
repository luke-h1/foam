import { Text } from '@app/components/ui/Text/Text';
import { Image } from '@app/components/Image/Image';
import { View } from 'react-native';
import type { EmoteMenuSet } from './emoteMenuData';
import { EmoteMenuIcon } from './EmoteMenuIcon';
import { emoteSheetStyles as styles } from './emoteSheetStyles';

export function SetHeader({ set }: { set: EmoteMenuSet }) {
  return (
    <View style={styles.setHeader}>
      <View style={styles.setHeaderIcon}>
        {set.icon.startsWith('avatar:') ? (
          <Image
            source={set.icon.slice(7)}
            style={styles.setHeaderAvatar}
            containerStyle={styles.setHeaderAvatarContainer}
            transition={100}
          />
        ) : (
          <EmoteMenuIcon
            icon={set.icon}
            isActive
            fallbackLabel={set.shortLabel}
          />
        )}
      </View>
      <Text numberOfLines={1} style={styles.setHeaderTitle}>
        {set.title}
      </Text>
    </View>
  );
}
