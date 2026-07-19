import type { Ref } from 'react';

export interface SearchInputBarHandle {
  setText: (text: string) => void;
  clearText: () => void;
  focus: () => void;
  blur: () => void;
}

export interface SearchInputBarProps {
  ref?: Ref<SearchInputBarHandle>;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}
