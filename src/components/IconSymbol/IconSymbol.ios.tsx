import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export const IconSymbol = memo(function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
  animationSpec,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
  animationSpec?: SymbolViewProps['animationSpec'];
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      animationSpec={animationSpec}
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
});
