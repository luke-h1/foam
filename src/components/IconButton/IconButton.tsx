import { Spacing } from '@app/styles';
import { Insets, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon } from '../Icon/Icon';
import { Spinner } from '../Spinner';

interface IconButtonProps {
  contrast?: boolean;
  hitSlop?: number | Insets;
  icon: string;
  label: string;
  loading?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  size?: Spacing;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contrast,
  hitSlop,
  icon,
  label,
  loading,
  onLongPress,
  onPress,
  size = 'md',
  style,
}: IconButtonProps) {
  return (
    <Button
      disabled={loading}
      hitSlop={hitSlop}
      label={label}
      style={[styles.button(size), style]}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      {loading ? <Spinner /> : <Icon icon={icon} />}
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  button: (size: Spacing) => ({
    alignItems: 'center',
    height: theme.spacing[size],
    width: theme.spacing[size],
  }),
}));
