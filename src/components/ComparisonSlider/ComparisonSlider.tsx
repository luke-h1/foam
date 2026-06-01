import { SliderHandle } from '@app/components/ComparisonSlider/SliderHandle';
import { Image, prefetchImage } from '@app/components/Image/Image';
import { impact } from '@app/lib/haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type ComparisonImagePair = {
  before: string;
  after: string;
};

type ComparisonSliderProps = {
  imagePairs: ComparisonImagePair[];
  autoRotateIntervalMs?: number;
  crossfadeDurationMs?: number;
  hapticsEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HANDLE_SIZE = 44;
const LINE_WIDTH = 2;
const HAPTIC_TICK_INTERVAL = 40;

async function playSoftImpact() {
  await impact('light');
}

async function playMediumImpact() {
  await impact('medium');
}

export function ComparisonSlider({
  imagePairs,
  autoRotateIntervalMs = 5000,
  crossfadeDurationMs = 1000,
  hapticsEnabled = true,
  style,
}: ComparisonSliderProps) {
  const sliderX = useSharedValue(SCREEN_WIDTH / 2);
  const savedSliderX = useSharedValue(SCREEN_WIDTH / 2);
  const lastHapticX = useSharedValue(SCREEN_WIDTH / 2);
  const layerAOpacity = useSharedValue(1);

  const initialIndex = useMemo(
    () => Math.floor(Math.random() * imagePairs.length),
    [imagePairs.length],
  );

  const [layerAIndex, setLayerAIndex] = useState(initialIndex);
  const [layerBIndex, setLayerBIndex] = useState(
    (initialIndex + 1) % imagePairs.length,
  );
  const [isLayerAActive, setIsLayerAActive] = useState(true);
  const stateRef = useRef({ isLayerAActive, layerAIndex, layerBIndex });
  stateRef.current = { isLayerAActive, layerAIndex, layerBIndex };

  useEffect(() => {
    imagePairs.forEach(pair => {
      void prefetchImage(pair.before);
      void prefetchImage(pair.after);
    });
  }, [imagePairs]);

  useEffect(() => {
    if (imagePairs.length < 2) {
      return;
    }

    const interval = setInterval(() => {
      const { current } = stateRef;

      if (current.isLayerAActive) {
        layerAOpacity.value = withTiming(
          0,
          {
            duration: crossfadeDurationMs,
            easing: Easing.inOut(Easing.ease),
          },
          finished => {
            'worklet';

            if (finished) {
              const nextIndex = (current.layerBIndex + 1) % imagePairs.length;
              scheduleOnRN<[number], void>(setLayerAIndex, nextIndex);
              scheduleOnRN<[boolean], void>(setIsLayerAActive, false);
            }
          },
        );
      } else {
        layerAOpacity.value = withTiming(
          1,
          {
            duration: crossfadeDurationMs,
            easing: Easing.inOut(Easing.ease),
          },
          finished => {
            'worklet';

            if (finished) {
              const nextIndex = (current.layerAIndex + 1) % imagePairs.length;
              scheduleOnRN<[number], void>(setLayerBIndex, nextIndex);
              scheduleOnRN<[boolean], void>(setIsLayerAActive, true);
            }
          },
        );
      }
    }, autoRotateIntervalMs);

    return () => clearInterval(interval);
  }, [
    autoRotateIntervalMs,
    crossfadeDurationMs,
    imagePairs.length,
    layerAOpacity,
  ]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(sliderX);
      savedSliderX.value = sliderX.value;
      lastHapticX.value = sliderX.value;

      if (hapticsEnabled) {
        scheduleOnRN(playSoftImpact);
      }
    })
    .onUpdate(event => {
      const nextX = savedSliderX.value + event.translationX;
      sliderX.value = Math.min(Math.max(nextX, 0), SCREEN_WIDTH);

      if (
        hapticsEnabled &&
        Math.abs(sliderX.value - lastHapticX.value) >= HAPTIC_TICK_INTERVAL
      ) {
        lastHapticX.value = sliderX.value;
        scheduleOnRN(playSoftImpact);
      }
    })
    .onEnd(() => {
      savedSliderX.value = sliderX.value;

      if (hapticsEnabled) {
        scheduleOnRN(playMediumImpact);
      }
    });

  const afterClipStyle = useAnimatedStyle(() => ({
    width: sliderX.value,
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value - LINE_WIDTH / 2 }],
  }));

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value - HANDLE_SIZE / 2 }],
  }));

  const layerAStyle = useAnimatedStyle(() => ({
    opacity: layerAOpacity.value,
  }));

  const layerBStyle = useAnimatedStyle(() => ({
    opacity: 1 - layerAOpacity.value,
  }));

  const layerAPair = imagePairs[layerAIndex];
  const layerBPair = imagePairs[layerBIndex];

  if (imagePairs.length === 0 || !layerAPair || !layerBPair) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.fullScreen, layerBStyle]}>
        <Image
          contentFit='cover'
          source={layerBPair.before}
          style={styles.image}
          transition={0}
        />
      </Animated.View>

      <Animated.View style={[styles.fullScreen, layerAStyle]}>
        <Image
          contentFit='cover'
          source={layerAPair.before}
          style={styles.image}
          transition={0}
        />
      </Animated.View>

      <Animated.View style={[styles.afterContainer, afterClipStyle]}>
        <Animated.View style={[styles.afterInner, layerBStyle]}>
          <Image
            contentFit='cover'
            source={layerBPair.after}
            style={[styles.image, { width: SCREEN_WIDTH }]}
            transition={0}
          />
        </Animated.View>

        <Animated.View style={[styles.afterInner, layerAStyle]}>
          <Image
            contentFit='cover'
            source={layerAPair.after}
            style={[styles.image, { width: SCREEN_WIDTH }]}
            transition={0}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View pointerEvents='none' style={[styles.line, lineStyle]} />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.handleWrapper, handleStyle]}>
          <SliderHandle size={HANDLE_SIZE} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  afterContainer: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  afterInner: {
    height: SCREEN_HEIGHT,
    left: 0,
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH,
  },
  container: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fullScreen: {
    height: SCREEN_HEIGHT,
    left: 0,
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH,
  },
  handleWrapper: {
    height: HANDLE_SIZE,
    marginTop: -HANDLE_SIZE / 2,
    position: 'absolute',
    top: '50%',
    width: HANDLE_SIZE,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  line: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: LINE_WIDTH,
  },
});
