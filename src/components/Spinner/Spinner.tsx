import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

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

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: theme.colors.black.bgAlpha,
  },
}));
