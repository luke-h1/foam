import { useCallback } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon } from '../Icon';

const SWITCH_WIDTH = 40;
const SWITCH_THUMB_SIZE = 20;
const SWITCH_HORIZONTAL_PADDING = 3;
const SWITCH_VERTICAL_PADDING = 3;
const SWITCH_HEIGHT = SWITCH_THUMB_SIZE + SWITCH_VERTICAL_PADDING * 2;
const SWITCH_MAX_OFFSET =
  SWITCH_WIDTH - SWITCH_THUMB_SIZE - SWITCH_HORIZONTAL_PADDING * 2;

const TRACK_DEFAULT_COLOR = '#4E505B';
const TRACK_ACTIVE_COLOR = '#5965F2';
const THUMB_COLOR = '#F5F5F5';

interface Props {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}

export function Switch({ onValueChange, value }: Props) {
  const offset = useSharedValue(value ? SWITCH_MAX_OFFSET : 0);
  const isOn = useSharedValue(value);

  const toggleSwitch = useCallback(() => {
    const newValue = !isOn.get();
    isOn.set(newValue);

    offset.set(
      withSpring(newValue ? SWITCH_MAX_OFFSET : 0, {
        damping: 25,
        stiffness: 300,
        mass: 4,
      }),
    );
    onValueChange?.(newValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.get() }],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      offset.get(),
      [0, SWITCH_MAX_OFFSET],
      [TRACK_DEFAULT_COLOR, TRACK_ACTIVE_COLOR],
    );

    return {
      backgroundColor,
    };
  });

  return (
    <Button onPress={toggleSwitch}>
      <Animated.View style={[styles.track, backgroundStyle]}>
        <Animated.View style={[styles.thumb, animatedStyle, styles.center]}>
          {value ? (
            <Animated.View key="check" entering={ZoomIn}>
              <Icon icon="check" color={TRACK_ACTIVE_COLOR} />
            </Animated.View>
          ) : (
            <Animated.View key="x" entering={ZoomIn}>
              <Icon icon="x" color={TRACK_ACTIVE_COLOR} />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Button>
  );
}

const styles = StyleSheet.create({
  track: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    paddingHorizontal: SWITCH_HORIZONTAL_PADDING,
    paddingVertical: SWITCH_VERTICAL_PADDING,
    borderCurve: 'continuous',
  },
  thumb: {
    width: SWITCH_THUMB_SIZE,
    height: SWITCH_THUMB_SIZE,
    borderRadius: SWITCH_THUMB_SIZE / 2,
    backgroundColor: THUMB_COLOR,
    borderCurve: 'continuous',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
