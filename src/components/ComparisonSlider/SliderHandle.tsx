import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

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
      <SymbolView name="arrow.up.arrow.down" size={24} tintColor="white" />
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
