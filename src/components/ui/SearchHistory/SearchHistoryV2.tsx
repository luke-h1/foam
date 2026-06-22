import { useCallback } from 'react';
import { Alert, StyleSheet,View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;
const HISTORY_ROW_HEIGHT = 44;
// Width of the resting (snapped-open) delete affordance.
const ACTION_WIDTH = 88;

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
  const { t } = useTranslation('common');
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
          withSpring(-ACTION_WIDTH, {
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

  // The red fill grows with the swipe so it always sits flush behind the row —
  // no bare background peeking through, even on a full swipe-to-delete.
  const animatedDeleteStyle = useAnimatedStyle(() => ({
    width: Math.max(-translateX.get(), 0),
  }));

  // The icon + label stay pinned to the right edge within a fixed-width slot so
  // they don't drift as the fill expands, and ease in as the action is revealed.
  const animatedDeleteContentStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.get(),
      [0, -ACTION_WIDTH],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
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
            <Animated.View
              style={[styles.deleteActionContent, animatedDeleteContentStyle]}
            >
              <SymbolView name='trash.fill' size={20} tintColor='#fff' />
              <Text style={styles.deleteActionLabel} weight='semibold'>
                {t('delete')}
              </Text>
            </Animated.View>
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

// The history section does not scroll; anything beyond this would render
// underneath the floating search bar.
const MAX_VISIBLE_HISTORY = 8;

export function SearchHistoryV2({
  history,
  onClearAll,
  onClearItem,
  onSelectItem,
}: SearchHistoryV2Props) {
  const { t } = useTranslation(['search', 'common']);
  const handleClearAll = useCallback(() => {
    Alert.alert(t('clearSearchHistory'), t('clearSearchHistoryConfirm'), [
      {
        text: t('common:cancel'),
        style: 'cancel',
      },
      {
        text: t('common:clearAll'),
        style: 'destructive',
        onPress: onClearAll,
      },
    ]);
  }, [onClearAll, t]);

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
          {t('recentSearches')}
        </Text>
        <PressableArea onPress={handleClearAll} hitSlop={8}>
          <Text type='xs' color='red.accent'>
            {t('common:clearAll')}
          </Text>
        </PressableArea>
      </View>

      <View style={styles.historyList}>
        {history.slice(0, MAX_VISIBLE_HISTORY).map(query => (
          <SwipeableHistoryItem
            key={query}
            query={query}
            onSelect={() => onSelectItem(query)}
            onDelete={() => onClearItem(query)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    alignItems: 'flex-end',
    backgroundColor: theme.colorRed,
    bottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  deleteActionButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    // Fixed slot pinned to the right edge keeps the icon + label from drifting
    // while the red fill expands beneath them during the swipe.
    width: ACTION_WIDTH,
  },
  deleteActionContent: {
    alignItems: 'center',
    gap: theme.space4,
    justifyContent: 'center',
  },
  deleteActionLabel: {
    color: '#fff',
    fontSize: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.space12,
    paddingHorizontal: theme.space16,
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    flexDirection: 'row',
    gap: theme.space12,
    height: HISTORY_ROW_HEIGHT,
    paddingHorizontal: theme.space16,
  },
  historyList: {
    backgroundColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius12,
    gap: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginHorizontal: theme.space16,
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
