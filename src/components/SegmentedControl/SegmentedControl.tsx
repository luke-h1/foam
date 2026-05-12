import { BlurView, type BlurViewProps } from 'expo-blur';
import { selection } from '@app/lib/haptics';
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

const AnimatedBlurView = Animated.createAnimatedComponent(
  BlurView as ComponentType<BlurViewProps>,
);

type SegmentedControlItem = {
  label: string;
};

type SegmentedControlProps = {
  items: SegmentedControlItem[];
  currentIndex: number;
  onChange: (index: number) => void;
};

export function SegmentedControl({
  items,
  currentIndex,
  onChange,
}: SegmentedControlProps) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);

  const segmentWidth = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }
    return width / items.length;
  }, [items.length, width]);

  useEffect(() => {
    translateX.value = withSpring(currentIndex * segmentWidth, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });
  }, [currentIndex, segmentWidth, translateX]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const activeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View onLayout={handleLayout} style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activePill,
          {
            width: segmentWidth > 0 ? segmentWidth - 2 : 0,
          },
          activeStyle,
        ]}
      >
        <AnimatedBlurView
          intensity={28}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.row}>
        {items.map((item, index) => {
          const active = index === currentIndex;
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                onChange(index);
                void selection();
              }}
              style={styles.pressable}
            >
              <Text
                type="xs"
                weight="semibold"
                color={active ? 'gray.text' : 'gray.textLow'}
                align="center"
                style={styles.label}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activePill: {
    borderRadius: 999,
    height: '100%',
    left: 1,
    position: 'absolute',
    top: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  label: {
    width: '100%',
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  row: {
    flexDirection: 'row',
    padding: 1,
  },
});
