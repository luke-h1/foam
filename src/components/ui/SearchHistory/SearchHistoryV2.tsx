import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import { useCallback } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;
const HISTORY_ROW_HEIGHT = 56;

interface SwipeableHistoryItemProps {
  query: string;
  onSelect: () => void;
  onDelete: () => void;
}

function SwipeableHistoryItem({
  query,
  onSelect,
  onDelete,
}: SwipeableHistoryItemProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(HISTORY_ROW_HEIGHT);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate(event => {
      // Only allow left swipe
      if (event.translationX < 0) {
        translateX.set(event.translationX);
      }
    })
    .onEnd(event => {
      if (event.translationX < DELETE_THRESHOLD) {
        // Full swipe - delete
        translateX.set(withTiming(-400, { duration: 200 }));
        itemHeight.set(withTiming(0, { duration: 200 }));
        opacity.set(
          withTiming(0, { duration: 200 }, finished => {
            if (finished) {
              scheduleOnRN(onDelete);
            }
          }),
        );
      } else if (event.translationX < SWIPE_THRESHOLD) {
        // Partial swipe - show delete button
        translateX.set(
          withSpring(-80, {
            damping: 20,
            stiffness: 200,
            mass: 4,
          }),
        );
      } else {
        // Snap back
        translateX.set(
          withSpring(0, {
            damping: 20,
            stiffness: 200,
            mass: 4,
          }),
        );
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.get() < -40) {
      // If swiped, tap snaps back
      translateX.set(
        withSpring(0, {
          damping: 20,
          stiffness: 200,
          mass: 4,
        }),
      );
    } else {
      scheduleOnRN(onSelect);
    }
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.get(),
    opacity: opacity.get(),
    overflow: 'hidden',
  }));

  const animatedDeleteStyle = useAnimatedStyle(() => {
    const deleteOpacity = interpolate(
      translateX.get(),
      [0, -40, -80],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: deleteOpacity,
    };
  });

  return (
    <Animated.View style={animatedContainerStyle}>
      <View style={styles.itemContainer}>
        {/* Delete action background */}
        <Animated.View style={[styles.deleteAction, animatedDeleteStyle]}>
          <PressableArea
            onPress={onDelete}
            style={styles.deleteActionButton}
            hitSlop={8}
          >
            <SymbolView name='trash' size={20} tintColor='#fff' />
          </PressableArea>
        </Animated.View>

        {/* Swipeable row */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.historyItem, animatedRowStyle]}>
            <SymbolView
              name='clock'
              tintColor={theme.color.textSecondary.dark}
              size={16}
            />
            <Text style={styles.query} numberOfLines={1}>
              {query}
            </Text>
            <SymbolView
              name='arrow.up.left'
              tintColor={theme.color.textSecondary.dark}
              size={16}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
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
      'Clear Search History',
      'Are you sure you want to clear all your recent searches?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
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
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text
          type='xs'
          weight='semibold'
          color='gray.textLow'
          style={styles.sectionTitle}
        >
          RECENT SEARCHES
        </Text>
        <PressableArea onPress={handleClearAll} hitSlop={8}>
          <Text type='xs' color='red.accent'>
            Clear All
          </Text>
        </PressableArea>
      </View>

      <View style={styles.historyList}>
        {history.map(query => (
          <SwipeableHistoryItem
            key={query}
            query={query}
            onSelect={() => onSelectItem(query)}
            onDelete={() => onClearItem(query)}
          />
        ))}
      </View>

      <Text type='xxs' color='gray.textLow' style={styles.hint}>
        Swipe left to delete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    alignItems: 'center',
    backgroundColor: theme.colorRed,
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 80,
  },
  deleteActionButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.space12,
    paddingHorizontal: theme.space16,
  },
  hint: {
    marginTop: theme.space16,
    opacity: 0.6,
    textAlign: 'center',
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flexDirection: 'row',
    gap: theme.space16,
    minHeight: HISTORY_ROW_HEIGHT,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  historyList: {
    gap: 1,
  },
  itemContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  query: {
    color: theme.color.text.dark,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  wrapper: {
    paddingTop: theme.space20,
  },
});
