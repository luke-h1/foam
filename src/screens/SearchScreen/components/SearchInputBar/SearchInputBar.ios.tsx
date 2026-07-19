import { useImperativeHandle, useRef } from 'react';
import type { SearchBarCommands } from 'react-native-screens';

import { Stack } from 'expo-router';

import type { SearchInputBarProps } from './types';

export function SearchInputBar({
  ref,
  placeholder,
  onCancel,
  onChangeText,
  onSubmit,
}: SearchInputBarProps) {
  const nativeRef = useRef<SearchBarCommands | null>(null);

  useImperativeHandle(ref, () => ({
    setText: text => nativeRef.current?.setText(text),
    clearText: () => nativeRef.current?.clearText(),
    focus: () => nativeRef.current?.focus(),
    blur: () => nativeRef.current?.blur(),
  }));

  return (
    <Stack.SearchBar
      ref={nativeRef}
      autoCapitalize='none'
      hideWhenScrolling={false}
      onCancelButtonPress={onCancel}
      onChangeText={event => onChangeText(event.nativeEvent.text)}
      onClose={onCancel}
      onSearchButtonPress={event => onSubmit(event.nativeEvent.text)}
      placeholder={placeholder}
      placement='automatic'
    />
  );
}
