import { colors } from '@app/styles';
import { ActivityIndicator, View, ViewStyle } from 'react-native';

export default function AppLoading() {
  return (
    <View style={$container}>
      <ActivityIndicator size="large" color={colors.tint} />
    </View>
  );
}

const $container: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.background,
};
