import { useCallback } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SymbolView } from 'expo-symbols';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

const DELETE_ACTION_WIDTH = 80;

interface SearchHistoryRowProps {
  query: string;
  isLast: boolean;
  onPress: () => void;
  onRemove: () => void;
}

function SearchHistoryRow({
  query,
  isLast,
  onPress,
  onRemove,
}: SearchHistoryRowProps) {
  const renderRightActions = () => (
    <PressableArea
      accessibilityLabel={`Delete ${query}`}
      accessibilityRole='button'
      onPress={onRemove}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteLabel} weight='semibold'>
        Delete
      </Text>
    </PressableArea>
  );

  return (
    <ReanimatedSwipeable
      friction={2}
      overshootRight={false}
      renderRightActions={renderRightActions}
      rightThreshold={DELETE_ACTION_WIDTH / 2}
    >
      <View style={[styles.row, isLast ? styles.rowLast : null]}>
        <PressableArea
          accessibilityLabel={`Search for ${query}`}
          accessibilityRole='button'
          onPress={onPress}
          style={styles.rowPressable}
        >
          <SymbolView
            name='clock'
            size={17}
            tintColor={theme.colorGreyHoverAlpha}
          />
          <Text style={styles.query} numberOfLines={1}>
            {query}
          </Text>
        </PressableArea>
        <PressableArea
          accessibilityLabel={`Remove ${query} from recent searches`}
          accessibilityRole='button'
          hitSlop={8}
          onPress={onRemove}
          style={styles.removeButton}
        >
          <SymbolView
            name='xmark.circle.fill'
            size={18}
            tintColor={theme.colorGreyHoverAlpha}
          />
        </PressableArea>
      </View>
    </ReanimatedSwipeable>
  );
}

interface SearchHistoryV2Props {
  history: string[];
  onClearItem: (id: string) => void;
  onSelectItem: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistoryV2({
  history,
  onClearAll,
  onClearItem,
  onSelectItem,
}: SearchHistoryV2Props) {
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear Recent Searches?',
      'This removes your recent search history from this device.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Recents',
          style: 'destructive',
          onPress: onClearAll,
        },
      ],
    );
  }, [onClearAll]);

  if (history.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text type='sm' weight='semibold' color='gray.textLow'>
          Recent Searches
        </Text>
        <PressableArea
          accessibilityLabel='Clear recent searches'
          accessibilityRole='button'
          hitSlop={8}
          onPress={handleClearAll}
        >
          <Text type='sm' color='red.accent'>
            Clear
          </Text>
        </PressableArea>
      </View>

      <View style={styles.card}>
        {history.map((query, index) => (
          <SearchHistoryRow
            key={query}
            isLast={index === history.length - 1}
            query={query}
            onPress={() => onSelectItem(query)}
            onRemove={() => onClearItem(query)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    overflow: 'hidden',
  },
  deleteAction: {
    alignItems: 'center',
    backgroundColor: theme.colorRed,
    justifyContent: 'center',
    width: DELETE_ACTION_WIDTH,
  },
  deleteLabel: {
    color: theme.colorWhite,
    fontSize: 15,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space16,
  },
  query: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 17,
  },
  removeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  row: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 44,
    paddingLeft: theme.space16,
    paddingRight: theme.space8,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressable: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 44,
    paddingRight: theme.space8,
  },
  section: {
    gap: theme.space8,
    marginTop: theme.space16,
  },
});
