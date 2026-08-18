import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { TextInput } from 'react-native';

export const router = {
  back: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(),
};

export const Stack = {
  Screen: () => null,
  // Stack.SearchBar renders into the native navigation header; surface it
  // as a plain TextInput so tests can type into it. The imperative ref mirrors
  // react-native-screens' SearchBarCommands: setText/clearText update the
  // visible text without re-firing onChangeText, matching the native search
  // bar (consumers rely on that to avoid double-triggering a search).
  SearchBar: React.forwardRef(
    (
      props: {
        placeholder?: string;
        onChangeText?: (e: { nativeEvent: { text: string } }) => void;
      },
      ref: React.Ref<unknown>,
    ) => {
      const inputRef = React.useRef<TextInput | null>(null);

      React.useImperativeHandle(ref, () => ({
        setText: (text: string) => inputRef.current?.setNativeProps({ text }),
        clearText: () => inputRef.current?.setNativeProps({ text: '' }),
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        toggleCancelButton: () => {},
        cancelSearch: () => {},
      }));

      return React.createElement(TextInput, {
        ref: inputRef,
        testID: 'search-input',
        placeholder: props.placeholder,
        onChangeText: (text: string) =>
          props.onChangeText?.({ nativeEvent: { text } }),
      });
    },
  ),
};

export const useFocusEffect = jest.fn((effect: () => void | (() => void)) => {
  React.useEffect(effect, [effect]);
});

export const useLocalSearchParams = jest.fn(() => ({}));

export const useNavigation = jest.fn(() => ({
  addListener: jest.fn(() => jest.fn()),
  goBack: jest.fn(),
  setOptions: jest.fn(),
}));

export const useScrollToTop = jest.fn();
export const usePathname = jest.fn(() => '/');

export const useRouter = jest.fn(() => ({
  back: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(),
}));
