import { colors, spacing } from '@app/styles';
import { radii } from '@app/styles/radii';
import Entypo from '@expo/vector-icons/build/Entypo';
import Feather from '@expo/vector-icons/build/Feather';
import { forwardRef, Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Input from '../Input';
import { PressableArea } from './PressableArea';

type SearchInputProps = TextInput['props'];

function SearchInput(
  { onChangeText, value, onBlur, ...rest }: SearchInputProps,
  ref: Ref<TextInput>,
) {
  return (
    <View style={styles.container}>
      <Input
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        style={[
          styles.input,
          { backgroundColor: colors.textDim, color: colors.text },
        ]}
        autoCorrect={false}
        returnKeyType="done"
        {...rest}
      />
      {!value ? (
        <Feather
          name="search"
          size={24}
          color={colors.textDim}
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
          <Entypo name="circle-with-cross" size={24} color={colors.textDim} />
        </PressableArea>
      ) : null}
    </View>
  );
}
export default forwardRef(SearchInput);

const styles = StyleSheet.create<{
  container: ViewStyle;
  input: TextStyle;
  searchIcon: TextStyle;
  clearIcon: ViewStyle;
}>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.large,
    marginTop: spacing.large,
    marginBottom: spacing.medium,
  },
  input: {
    borderRadius: radii.sm,
    padding: spacing.small,
    flex: 1,
  },
  searchIcon: {
    marginLeft: spacing.small,
  },
  clearIcon: {
    marginLeft: spacing.small,
  },
});
