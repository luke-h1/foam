import { BlurView } from 'expo-blur';
import { useEffect, useState, memo } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Input, type ThemedInputProps } from '@app/components/ui/Input/Input';

type AnimatedInputBarProps = ThemedInputProps & {
  placeholders: string[];
  animationInterval?: number;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
  characterEnterDuration?: number;
  characterExitDuration?: number;
  characterDelayIncrement?: number;
  blurAnimationDuration?: number;
};

type CharacterProps = {
  char: string;
  index: number;
  enterDuration: number;
  exitDuration: number;
  delayIncrement: number;
  style?: StyleProp<TextStyle>;
};

function Character({
  char,
  index,
  enterDuration,
  exitDuration,
  delayIncrement,
  style,
}: CharacterProps) {
  const animationDelay = index * delayIncrement;

  const enteringAnimation = () => {
    'worklet';

    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: 20 }, { scale: 0.5 }],
      },
      animations: {
        opacity: withDelay(
          animationDelay,
          withTiming(1, { duration: enterDuration }),
        ),
        transform: [
          {
            translateY: withDelay(
              animationDelay,
              withSpring(0, {
                damping: 15,
                stiffness: 150,
                mass: 0.9,
              }),
            ),
          },
          {
            scale: withDelay(
              animationDelay,
              withSpring(1, {
                damping: 15,
                stiffness: 150,
                mass: 0.9,
              }),
            ),
          },
        ],
      },
    };
  };

  const exitingAnimation = () => {
    'worklet';

    return {
      initialValues: {
        opacity: 1,
        transform: [{ translateY: 0 }, { scale: 1 }],
      },
      animations: {
        opacity: withDelay(
          animationDelay,
          withTiming(0, { duration: exitDuration }),
        ),
        transform: [
          {
            translateY: withDelay(
              animationDelay,
              withTiming(-5, { duration: exitDuration }),
            ),
          },
          {
            scale: withDelay(
              animationDelay,
              withTiming(0.5, { duration: exitDuration }),
            ),
          },
        ],
      },
    };
  };

  return (
    <Animated.Text
      entering={enteringAnimation}
      exiting={exitingAnimation}
      layout={LinearTransition.duration(180).easing(
        Easing.bezier(0.25, 0.1, 0.25, 1),
      )}
      style={style}
    >
      {char}
    </Animated.Text>
  );
}

function StaggeredPlaceholder({
  text,
  enterDuration,
  exitDuration,
  delayIncrement,
  style,
}: {
  text: string;
  enterDuration: number;
  exitDuration: number;
  delayIncrement: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Animated.View
      layout={LinearTransition.duration(300).easing(
        Easing.bezier(0.25, 0.1, 0.25, 1),
      )}
      style={styles.placeholderWrapper}
    >
      {Array.from(text).map((char, index) => (
        <Character
          char={char}
          delayIncrement={delayIncrement}
          enterDuration={enterDuration}
          exitDuration={exitDuration}
          index={index}
          // eslint-disable-next-line react/no-array-index-key
          key={`${char}-${index}-${text}`}
          style={style}
        />
      ))}
    </Animated.View>
  );
}

export const AnimatedInputBar = memo(function AnimatedInputBar({
  placeholders,
  animationInterval = 3000,
  value,
  onChangeText,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  placeholderStyle,
  characterEnterDuration = 300,
  characterExitDuration = 200,
  characterDelayIncrement = 30,
  blurAnimationDuration = 400,
  onBlur,
  onFocus,
  ...props
}: AnimatedInputBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const blurProgress = useSharedValue(0);
  const inputValue = String(value ?? '');

  useEffect(() => {
    if (isFocused || inputValue || placeholders.length === 0) {
      return;
    }

    blurProgress.set(
      withSequence(
        withTiming(1, {
          duration: blurAnimationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(0, {
          duration: blurAnimationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      ),
    );
  }, [
    blurAnimationDuration,
    blurProgress,
    currentIndex,
    inputValue,
    isFocused,
    placeholders.length,
  ]);

  useEffect(() => {
    if (isFocused || inputValue || placeholders.length === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentIndex(previous => (previous + 1) % placeholders.length);
    }, animationInterval);

    return () => clearTimeout(timeout);
  }, [
    animationInterval,
    currentIndex,
    inputValue,
    isFocused,
    placeholders.length,
  ]);

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
  };

  const blurOverlayStyle = useAnimatedStyle(() => ({
    opacity: withSpring(
      interpolate(blurProgress.get(), [0, 0.2, 1], [0, 0.2, 0.45]),
    ),
  }));

  const activePlaceholder = placeholders[currentIndex] ?? '';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[styles.inputWrapper, inputWrapperStyle]}>
        {!isFocused && !inputValue && activePlaceholder ? (
          <StaggeredPlaceholder
            delayIncrement={characterDelayIncrement}
            enterDuration={characterEnterDuration}
            exitDuration={characterExitDuration}
            style={[styles.character, placeholderStyle]}
            text={activePlaceholder}
          />
        ) : null}

        <Animated.View
          pointerEvents='none'
          style={[StyleSheet.absoluteFill, styles.blurMask, blurOverlayStyle]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Input
          {...props}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          placeholderTextColor='transparent'
          radius='none'
          size='sm'
          style={[styles.input, inputStyle]}
          value={inputValue}
          variant='soft'
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  blurMask: {
    overflow: 'hidden',
  },
  character: {
    color: '#71717a',
    fontSize: 16,
    fontWeight: '400',
  },
  input: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    color: '#fafafa',
    minHeight: 36,
    fontSize: 16,
    fontWeight: '400',
    height: 36,
    paddingVertical: 0,
  },
  inputWrapper: {
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 16,
    position: 'relative',
  },
  placeholderWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    left: 18,
    pointerEvents: 'none',
    position: 'absolute',
  },
  wrapper: {
    marginVertical: 8,
  },
});
