import { View, Animated, Easing } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export function Spinner() {
  const spinValue = new Animated.Value(0);
  const { styles } = useStyles(stylesheet);

  Animated.loop(
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ).start();

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.spinner, { transform: [{ rotate: spin }] }]}
      >
        <View style={styles.circle} />
      </Animated.View>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
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
    borderColor: theme.colors.borderNeutral,
  },
}));
