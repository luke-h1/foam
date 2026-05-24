import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { theme } from '@app/styles/themes';
import { Text } from '@app/components/ui/Text/Text';

interface ScrollAdaptiveHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  topInset: number;
}

export function ScrollAdaptiveHeader({
  title,
  subtitle,
  scrollY,
  topInset,
}: ScrollAdaptiveHeaderProps) {
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [44, 108], [0, 1], Extrapolation.CLAMP),
  }));

  const overlayTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [52, 112], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [52, 112],
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const overlaySubtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [76, 132],
      [0, 0.7],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [76, 132],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          paddingTop: topInset + 4,
          height: topInset + (subtitle ? 68 : 56),
        },
        overlayStyle,
      ]}
    >
      <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlayBorder} />
      <Animated.View style={[styles.overlayContent, overlayTextStyle]}>
        <Text type="md" weight="bold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Animated.View style={[styles.subtitleWrap, overlaySubtitleStyle]}>
            <Text
              type="xxs"
              weight="medium"
              color="gray.textLow"
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  overlayBorder: {
    ...StyleSheet.absoluteFill,
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    paddingHorizontal: theme.space56,
    paddingTop: 4,
  },
  subtitle: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  subtitleWrap: {
    marginTop: 1,
  },
});
