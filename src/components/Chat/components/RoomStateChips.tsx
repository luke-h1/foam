import { StyleSheet, View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { useChannelRoomState } from '@app/store/chat/react/transientSelectors';
import { theme } from '@app/styles/themes';

import { buildRoomStateChips } from '../util/roomState';

interface RoomStateChipsProps {
  channelId: string;
}

export function RoomStateChips({ channelId }: RoomStateChipsProps) {
  const roomState = useChannelRoomState(channelId);
  if (!roomState) {
    return null;
  }

  const chips = buildRoomStateChips(roomState);
  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {chips.map(chip => (
        <View key={chip.key} style={styles.chip}>
          <Text type='xs' weight='semibold' style={styles.chipLabel}>
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: theme.colorBackgroundTertiaryAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space8,
    paddingVertical: 2,
  },
  chipLabel: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space4,
    paddingBottom: theme.space4,
    paddingHorizontal: theme.space12,
  },
});
