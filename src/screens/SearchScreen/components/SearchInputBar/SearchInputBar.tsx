import { useImperativeHandle, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

import type { SearchInputBarProps } from './types';

export function SearchInputBar({
  ref,
  placeholder,
  value,
  onCancel,
  onChangeText,
  onSubmit,
}: SearchInputBarProps) {
  const inputRef = useRef<TextInput | null>(null);

  useImperativeHandle(ref, () => ({
    setText: text => onChangeText(text),
    clearText: () => onChangeText(''),
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  const hasValue = value.length > 0;

  return (
    <View style={styles.wrap}>
      <SymbolView
        name='magnifyingglass'
        style={styles.icon}
        tintColor={theme.color.textSecondary.dark}
      />
      <TextInput
        ref={inputRef}
        autoCapitalize='none'
        autoComplete='off'
        autoCorrect={false}
        onChangeText={onChangeText}
        onSubmitEditing={event => onSubmit(event.nativeEvent.text)}
        placeholder={placeholder}
        placeholderTextColor={theme.color.textSecondary.dark}
        returnKeyType='search'
        style={styles.input}
        testID='search-input'
        value={value}
      />
      {hasValue && (
        <Pressable
          accessibilityRole='button'
          onPress={onCancel}
          style={styles.clearButton}
        >
          <SymbolView name='xmark' tintColor={theme.color.text.dark} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.24)',
    borderRadius: theme.borderRadius999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  icon: {
    color: theme.color.textSecondary.dark,
    opacity: 0.7,
  },
  input: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize16,
    fontWeight: '400',
    height: 40,
    paddingVertical: 0,
  },
  wrap: {
    alignItems: 'center',
    backgroundColor: theme.colorSurfaceAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: theme.space4,
    marginHorizontal: theme.space16,
    marginTop: theme.space8,
    paddingHorizontal: theme.space12,
  },
});
