import { selection } from '@app/lib/haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  RectButton,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

type TopTabSwitcherProps = {
  items: string[];
  currentIndex: number;
  onChange: (index: number) => void;
};

export function TopTabSwitcher({
  items,
  currentIndex,
  onChange,
}: TopTabSwitcherProps) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const activeScale = useSharedValue(1);
  const currentIndexSV = useSharedValue(currentIndex);
  const dragStartIndex = useSharedValue(currentIndex);
  const isDragging = useSharedValue(false);
  const tabWidth = items.length > 0 ? width / items.length : 0;

  useEffect(() => {
    currentIndexSV.value = currentIndex;
    translateX.value = withSpring(currentIndex * tabWidth, {
      damping: 18,
      stiffness: 80,
      mass: 1,
    });
  }, [currentIndex, currentIndexSV, tabWidth, translateX]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      onChange(index);
      void selection();
    },
    [onChange],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10)
        .onStart(() => {
          isDragging.value = true;
          dragStartIndex.value = currentIndexSV.value;
          activeScale.value = withSpring(1.2, {
            stiffness: 300,
            damping: 15,
          });
          scheduleOnRN(selection);
        })
        .onUpdate(event => {
          if (tabWidth <= 0 || items.length === 0) {
            return;
          }

          const rawIndex = Math.floor(event.x / tabWidth);
          const newIndex = Math.max(0, Math.min(items.length - 1, rawIndex));

          if (newIndex !== currentIndexSV.value) {
            currentIndexSV.value = newIndex;
            translateX.value = withSpring(newIndex * tabWidth, {
              stiffness: 80,
              damping: 90,
              mass: 1,
            });
            scheduleOnRN(handleSelect, newIndex);
          }
        })
        .onEnd(() => {
          isDragging.value = false;
          activeScale.value = withSpring(1, {
            stiffness: 200,
            damping: 20,
          });
        })
        .onFinalize(() => {
          isDragging.value = false;
          activeScale.value = withSpring(1, {
            stiffness: 200,
            damping: 20,
          });
        }),
    [
      activeScale,
      currentIndexSV,
      dragStartIndex,
      handleSelect,
      isDragging,
      items.length,
      tabWidth,
      translateX,
    ],
  );

  const activeStyle = useAnimatedStyle((): ViewStyle => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: activeScale.value },
      ],
    };
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View onLayout={handleLayout} style={styles.shell}>
        <Animated.View
          pointerEvents='none'
          style={[
            styles.activeSegment,
            {
              width: tabWidth > 0 ? tabWidth - 4 : 0,
            },
            activeStyle,
          ]}
        />

        <View style={styles.row}>
          {items.map((item, index) => {
            const active = index === currentIndex;
            const showDivider = index < items.length - 1;

            return (
              <View key={item} style={styles.segment}>
                <RectButton
                  onPress={() => handleSelect(index)}
                  testID={`top-tab-${item.toLowerCase()}`}
                  style={styles.pressable}
                >
                  <Text
                    type='sm'
                    weight='semibold'
                    align='center'
                    color={active ? 'gray.text' : 'gray.textLow'}
                  >
                    {item}
                  </Text>
                </RectButton>
                {showDivider ? <View style={styles.divider} /> : null}
              </View>
            );
          })}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  activeSegment: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: '100%',
    left: 2,
    position: 'absolute',
    top: 2,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 9,
    position: 'absolute',
    right: 0,
    top: 9,
    width: 1,
  },
  pressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  row: {
    flexDirection: 'row',
    padding: 2,
  },
  segment: {
    flex: 1,
    position: 'relative',
  },
  shell: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
