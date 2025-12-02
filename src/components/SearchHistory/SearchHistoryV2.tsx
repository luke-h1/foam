import { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon } from '../Icon';
import { PressableArea } from '../PressableArea';
import { Typography } from '../Typography';

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;

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
  const { theme } = useUnistyles();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(52);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate(event => {
      // Only allow left swipe
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(event => {
      if (event.translationX < DELETE_THRESHOLD) {
        // Full swipe - delete
        translateX.value = withTiming(-400, { duration: 200 });
        itemHeight.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, finished => {
          if (finished) {
            scheduleOnRN(onDelete);
          }
        });
      } else if (event.translationX < SWIPE_THRESHOLD) {
        // Partial swipe - show delete button
        translateX.value = withSpring(-80, {
          damping: 20,
          stiffness: 200,
          mass: 4,
        });
      } else {
        // Snap back
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
          mass: 4,
        });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.value < -40) {
      // If swiped, tap snaps back
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
        mass: 4,
      });
    } else {
      runOnJS(onSelect)();
    }
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  const animatedDeleteStyle = useAnimatedStyle(() => {
    const deleteOpacity = interpolate(
      translateX.value,
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
            <Icon icon="trash" size={20} color="#fff" />
          </PressableArea>
        </Animated.View>

        {/* Swipeable row */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.historyItem, animatedRowStyle]}>
            <Icon icon="clock" color={theme.colors.gray.textLow} size={16} />
            <Typography style={styles.query} numberOfLines={1}>
              {query}
            </Typography>
            <Icon
              icon="arrow-up-left"
              color={theme.colors.gray.textLow}
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
        <Typography
          size="xs"
          fontWeight="semiBold"
          color="gray.textLow"
          style={styles.sectionTitle}
        >
          RECENT SEARCHES
        </Typography>
        <PressableArea onPress={handleClearAll} hitSlop={8}>
          <Typography size="xs" color="red.accent">
            Clear All
          </Typography>
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

      <Typography size="xxs" color="gray.textLow" style={styles.hint}>
        Swipe left to delete
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  wrapper: {
    paddingTop: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  historyList: {
    gap: 1,
  },
  itemContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  query: {
    flex: 1,
    color: theme.colors.gray.text,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: theme.colors.red.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    opacity: 0.6,
  },
}));
