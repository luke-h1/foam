import { Button, Icon } from '@app/components';
import { TextBox } from '@app/components/TextBox';
import {
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SearchProps {
  onChange?: (value: string) => void;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  placeholder?: 'search' | 'filter';
  style?: StyleProp<ViewStyle>;
  rightOnPress?: () => void;
  leftOnPress?: () => void;
  value?: string;
}

export function SearchBox({
  onChange,
  onSubmitEditing,
  placeholder,
  style,
  value,
  leftOnPress,
  rightOnPress,
}: SearchProps) {
  return (
    <TextBox
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect={false}
      left={
        <Button onPress={() => leftOnPress?.()}>
          <Icon icon="search" style={styles.icon} />
        </Button>
      }
      onChangeText={onChange}
      onSubmitEditing={onSubmitEditing}
      placeholder={placeholder}
      right={
        <Button
          onPress={() => rightOnPress?.()}
          style={[
            styles.clearButton,
            { opacity: value && value.length > 0 ? 1 : 0 },
          ]}
          disabled={!value || value.length === 0}
        >
          <Icon icon="x" style={styles.clear} />
        </Button>
      }
      style={[styles.main, style]}
      styleContent={styles.content}
      value={value}
    />
  );
}

const styles = StyleSheet.create(theme => ({
  clear: {
    height: theme.spacing.xl,
    width: theme.spacing.xl,
  },
  clearButton: {
    // Add any specific styling for the clear button container if needed
  },
  content: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  icon: {
    marginLeft: theme.spacing.md,
  },
  main: {
    flexGrow: 1,
    height: theme.spacing['2xl'],
  },
}));
