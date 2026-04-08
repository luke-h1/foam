import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function Spinner() {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: withRepeat(withTiming('360deg', { duration: 1000 }), -1) },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, animatedStyle]}>
        <View style={styles.circle} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderColor: theme.colors.black.bgAlpha,
    borderRadius: 20,
    borderWidth: 5,
    height: 40,
    width: 40,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  spinner: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
});
