import { Image } from '@app/components/Image/Image';
import { DEFAULT_BLURHASH } from '@app/components/ImageZoomView/constants';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ImageZoomViewProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
  placeholder?: string;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

const TIMING_CONFIG = {
  duration: 300,
} as const;

export function ImageZoomView({
  uri,
  style,
  minScale = 1,
  maxScale = 4,
  placeholder = DEFAULT_BLURHASH,
}: ImageZoomViewProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const containerWidth = useSharedValue(1);
  const containerHeight = useSharedValue(1);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const clampTranslation = (
    x: number,
    y: number,
    scaleValue: number,
  ): { x: number; y: number } => {
    'worklet';

    if (scaleValue <= 1) {
      return { x: 0, y: 0 };
    }

    const scaledWidth = containerWidth.value * scaleValue;
    const scaledHeight = containerHeight.value * scaleValue;
    const maxTranslateX = Math.max(0, (scaledWidth - containerWidth.value) / 2);
    const maxTranslateY = Math.max(
      0,
      (scaledHeight - containerHeight.value) / 2,
    );

    return {
      x: Math.min(Math.max(x, -maxTranslateX), maxTranslateX),
      y: Math.min(Math.max(y, -maxTranslateY), maxTranslateY),
    };
  };

  const reset = () => {
    'worklet';

    scale.value = withSpring(1, SPRING_CONFIG);
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .enableTrackpadTwoFingerGesture(true)
    .maxPointers(2)
    .onStart(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate(event => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(event => {
      if (scale.value > 1) {
        const velocityFactor = 0.2;
        const targetX = translateX.value + event.velocityX * velocityFactor;
        const targetY = translateY.value + event.velocityY * velocityFactor;
        const clamped = clampTranslation(targetX, targetY, scale.value);

        translateX.value = withSpring(clamped.x, SPRING_CONFIG);
        translateY.value = withSpring(clamped.y, SPRING_CONFIG);
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(event => {
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      savedScale.value = scale.value;
      originX.value = event.focalX - containerWidth.value / 2;
      originY.value = event.focalY - containerHeight.value / 2;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate(event => {
      const nextScale = savedScale.value * event.scale;
      const clampedScale = Math.max(
        minScale * 0.85,
        Math.min(nextScale, maxScale * 1.1),
      );
      const scaleDiff = clampedScale - savedScale.value;

      scale.value = clampedScale;
      translateX.value = savedTranslateX.value - originX.value * scaleDiff;
      translateY.value = savedTranslateY.value - originY.value * scaleDiff;
    })
    .onEnd(() => {
      if (scale.value < minScale) {
        reset();
        return;
      }

      if (scale.value > maxScale) {
        const scaleRatio = maxScale / scale.value;

        scale.value = withSpring(maxScale, SPRING_CONFIG);
        translateX.value = withSpring(
          translateX.value * scaleRatio,
          SPRING_CONFIG,
        );
        translateY.value = withSpring(
          translateY.value * scaleRatio,
          SPRING_CONFIG,
        );
        savedScale.value = maxScale;
        return;
      }

      const clamped = clampTranslation(
        translateX.value,
        translateY.value,
        scale.value,
      );

      if (
        Math.abs(clamped.x - translateX.value) > 1 ||
        Math.abs(clamped.y - translateY.value) > 1
      ) {
        translateX.value = withSpring(clamped.x, SPRING_CONFIG);
        translateY.value = withSpring(clamped.y, SPRING_CONFIG);
      }

      savedScale.value = scale.value;
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(event => {
      if (scale.value > 1.1) {
        reset();
        return;
      }

      const targetScale = Math.min(2.5, maxScale);
      const tapX = event.x - containerWidth.value / 2;
      const tapY = event.y - containerHeight.value / 2;
      const targetX = -tapX * (targetScale - 1);
      const targetY = -tapY * (targetScale - 1);
      const clamped = clampTranslation(targetX, targetY, targetScale);

      scale.value = withTiming(targetScale, TIMING_CONFIG);
      translateX.value = withTiming(clamped.x, TIMING_CONFIG);
      translateY.value = withTiming(clamped.y, TIMING_CONFIG);
      savedScale.value = targetScale;
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        onLayout={event => {
          containerWidth.value = event.nativeEvent.layout.width;
          containerHeight.value = event.nativeEvent.layout.height;
        }}
        style={[styles.container, style]}
      >
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image
            cachePolicy="memory-disk"
            contentFit="contain"
            placeholder={placeholder}
            source={uri}
            style={styles.image}
            transition={200}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
});
