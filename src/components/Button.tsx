import useThemeColor from '@app/hooks/useThemeColor';
import theme from '@app/styles/theme';
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  ViewStyle,
  Button as BaseButton,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import ThemedText from './ThemedText';

const buttonTextSize = 22;

type Props = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
} & BaseButton['props'];

export default function Button({ onPress, title, isLoading, ...rest }: Props) {
  const shadow = useThemeColor({ light: theme.dropShadow, dark: undefined });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, shadow]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.color.white} testID="button-loading" />
      ) : (
        <ThemedText
          fontSize={buttonTextSize}
          fontWeight="medium"
          style={styles.text}
          {...rest}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create<{
  text: TextStyle;
  button: ViewStyle;
}>({
  text: {
    color: theme.color.white,
    lineHeight: buttonTextSize,
  },
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderradii.sm,
    backgroundColor: theme.color.darkBlue,
    minWidth: 150,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
