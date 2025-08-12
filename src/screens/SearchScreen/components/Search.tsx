import { Icon } from '@app/components';
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
  value?: string;
}

export function SearchBox({
  onChange,
  onSubmitEditing,
  placeholder,
  style,
  value,
}: SearchProps) {
  return (
    <TextBox
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect={false}
      left={<Icon icon="search" style={styles.icon} />}
      onChangeText={onChange}
      onSubmitEditing={onSubmitEditing}
      placeholder={placeholder}
      right={
        value && value.length > 0 ? (
          <Icon icon="x" style={styles.clear} />
        ) : null
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
  content: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  icon: {
    marginLeft: theme.spacing.md,
  },
  main: {
    flexGrow: 1,
    height: theme.spacing.xl,
  },
}));
