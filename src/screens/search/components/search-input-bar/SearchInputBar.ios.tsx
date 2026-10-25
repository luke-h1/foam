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

  // Keep the bar expanded on mount. hideWhenScrolling collapses it to zero
  // height on Fabric cold opens (react-native-screens#4381). Stacked
  // placement keeps it under the large title so iOS 26 does not park it in a
  // toolbar slot we do not mount.
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
      placement='stacked'
    />
  );
}
