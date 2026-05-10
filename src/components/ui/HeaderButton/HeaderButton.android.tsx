import { theme } from '@app/styles/themes';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// eslint-disable-next-line no-restricted-imports
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

const SIZE = theme.fontSize18;

export interface HeaderButtonProps {
  imageProps?: {
    systemName?: string;
    color?: string;
    size?: number;
  };
  buttonProps?: {
    onPress?: () => void;
    variant?: string;
  };
  style?: StyleProp<ViewStyle>;
}

const sfToMaterial: Record<string, string> = {
  xmark: 'close',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'chevron-up',
  'chevron.down': 'chevron-down',
  plus: 'plus',
  trash: 'trash-can-outline',
  gear: 'cog',
  ellipsis: 'dots-horizontal',
};

export function HeaderButton({
  imageProps,
  buttonProps,
  style,
}: HeaderButtonProps) {
  const sf = imageProps?.systemName || 'xmark';
  const iconName = sfToMaterial[sf] || 'close';

  return (
    <Pressable
      onPress={buttonProps?.onPress}
      style={[styles.button, { width: SIZE, height: SIZE }, style]}
    >
      <MaterialCommunityIcons
        // @ts-expect-error fix type type
        name={iconName as unknown}
        size={imageProps?.size || SIZE}
        color={imageProps?.color || 'white'}
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
