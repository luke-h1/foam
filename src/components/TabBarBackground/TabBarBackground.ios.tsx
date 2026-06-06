import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

function BlurTabBarBackground() {
  return (
    <BlurView
      tint='systemChromeMaterial'
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default BlurTabBarBackground;

export { useBottomTabOverflow } from './useBottomTabOverflow';
