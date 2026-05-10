import { UISize } from '@app/styles/ui';
import { SFSymbol, SymbolView } from 'expo-symbols';
import { StyleSheet, ViewStyle } from 'react-native';

interface IconProps {
  symbol: SFSymbol;
  size?: UISize | number;
  color?: string;
  style?: ViewStyle;
  type?: 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';
}

const sizeMap: Record<UISize, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
  '2xl': 34,
};

export const Icon = ({
  symbol,
  size = 'md',
  color,
  style,
  type = 'hierarchical',
}: IconProps) => {
  const iconSize = typeof size === 'string' ? sizeMap[size] : size;

  return (
    <SymbolView
      name={symbol}
      style={[styles.symbol, { width: iconSize, height: iconSize }, style]}
      tintColor={color}
      type={type}
      resizeMode="scaleAspectFit"
    />
  );
};

const styles = StyleSheet.create({
  symbol: {
    height: 24,
    width: 24,
  },
});
