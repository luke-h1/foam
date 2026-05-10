import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type SliderHandleProps = {
  size: number;
};

export function SliderHandle({ size }: SliderHandleProps) {
  const handleSizeStyle = {
    borderRadius: size / 2,
    height: size,
    width: size,
  } as const;

  return (
    <View style={[styles.handle, handleSizeStyle]}>
      <MaterialCommunityIcons
        color="white"
        name="unfold-more-vertical"
        size={24}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: 'white',
    borderCurve: 'continuous',
    borderWidth: 2,
    justifyContent: 'center',
  },
});
