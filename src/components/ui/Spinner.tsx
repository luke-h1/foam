import { colors } from '@app/styles';
import { View, Animated, Easing, ViewStyle } from 'react-native';

export default function Spinner() {
  const spinValue = new Animated.Value(0);

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
    <View style={$container}>
      <Animated.View style={[$spinner, { transform: [{ rotate: spin }] }]}>
        <View style={$circle} />
      </Animated.View>
    </View>
  );
}

const $container: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

const $spinner: ViewStyle = {
  width: 50,
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
};

const $circle: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 5,
  borderColor: colors.palette.primary500,
};
