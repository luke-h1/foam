import { theme } from '@app/styles/themes';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import {
  StyleSheet,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

const SIZE = theme.fontSize18;
const SF_SYMBOL_FALLBACK: SFSymbol = 'xmark';

export interface HeaderButtonProps {
  imageProps?: {
    systemName?: SFSymbol;
    color?: ColorValue;
    size?: number;
  };
  buttonProps?: {
    onPress?: () => void;
    variant?: string;
  };
  style?: StyleProp<ViewStyle>;
}

function getAndroidHeaderSymbol(systemName: SFSymbol): AndroidSymbol {
  switch (systemName) {
    case 'chevron.left':
      return 'chevron_left';
    case 'chevron.right':
      return 'chevron_right';
    case 'chevron.up':
      return 'expand_less';
    case 'chevron.down':
      return 'expand_more';
    case 'plus':
      return 'add';
    case 'trash':
      return 'delete';
    case 'gear':
      return 'settings';
    case 'ellipsis':
      return 'more_horiz';
    case 'xmark':
    default:
      return 'close';
  }
}

export function HeaderButton({
  imageProps,
  buttonProps,
  style,
}: HeaderButtonProps) {
  const systemName = imageProps?.systemName ?? SF_SYMBOL_FALLBACK;

  return (
    <Pressable
      onPress={buttonProps?.onPress}
      style={[styles.button, { width: SIZE, height: SIZE }, style]}
    >
      <SymbolView
        name={{
          ios: systemName,
          android: getAndroidHeaderSymbol(systemName),
        }}
        size={imageProps?.size || SIZE}
        tintColor={imageProps?.color || 'white'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
