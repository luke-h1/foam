import useThemeColor from '@app/hooks/useThemeColor';
import theme from '@app/styles/theme';
import Entypo from '@expo/vector-icons/build/Entypo';
import Feather from '@expo/vector-icons/build/Feather';
import { forwardRef, Ref } from 'react';
import {
  StyleSheet,
  TextInput as TextInputBase,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { PressableArea } from './PressableArea';

type SearchInputProps = TextInputBase['props'];

function SearchInput(
  { onChangeText, value, onBlur, ...rest }: SearchInputProps,
  ref: Ref<TextInputBase>,
) {
  const iconColor = useThemeColor({
    light: theme.color.grey,
    dark: theme.color.white,
  });

  const textColor = useThemeColor({
    light: theme.color.black,
    dark: theme.color.white,
  });

  const searchInputColor = useThemeColor({
    light: theme.color.white,
    dark: 'rgba(255,255,255,0.15)',
  });

  const placeholderTextColor = useThemeColor({
    light: theme.color.grey,
    dark: 'rgba(255,255,255,0.5)',
  });

  const shadow = useThemeColor({ light: theme.dropShadow, dark: undefined });

  return (
    <View style={styles.container}>
      <TextInputBase
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholderTextColor={placeholderTextColor}
        style={[
          styles.input,
          shadow,
          { backgroundColor: searchInputColor, color: textColor },
        ]}
        autoCorrect={false}
        returnKeyType="done"
        {...rest}
      />
      {!value ? (
        <Feather
          name="search"
          size={24}
          color={iconColor}
          style={styles.searchIcon}
          onPress={() => onChangeText?.('')}
        />
      ) : null}

      {value ? (
        <PressableArea
          onPress={() => onChangeText?.('')}
          style={styles.clearIcon}
          hitSlop={30}
        >
          <Entypo name="circle-with-cross" size={24} color={iconColor} />
        </PressableArea>
      ) : null}
    </View>
  );
}
export default forwardRef(SearchInput);

const styles = StyleSheet.create<{
  container: ViewStyle;
  input: TextStyle;
  searchIcon: ViewStyle;
  clearIcon: ViewStyle;
}>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  input: {
    borderRadius: theme.borderradii.sm,
    padding: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.md,
    flex: 1,
  },
  searchIcon: {
    marginLeft: theme.spacing.sm,
  },
  clearIcon: {
    marginLeft: theme.spacing.sm,
  },
});
