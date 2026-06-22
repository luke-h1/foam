import { SafeAreaProvider } from 'react-native-safe-area-context';

import { render } from '@testing-library/react-native';

import type { ChatComposerProps } from '../ChatComposer/ChatComposer';
import { ChatInputSection } from '../ChatInputSection';

const mockChatComposer = jest.fn();

jest.mock('../ChatComposer/ChatComposer', () => {
  const React = require('react');
  const { TextInput: MockTextInput } = require('react-native');

  return {
    ChatComposer: React.forwardRef((props: ChatComposerProps, ref: unknown) => {
      mockChatComposer(props);
      return <MockTextInput ref={ref} testID='chat-composer' />;
    }),
  };
});

describe('ChatInputSection', () => {
  beforeEach(() => {
    mockChatComposer.mockClear();
  });

  test('passes composer API (onSubmit, onPressAdd, onChangeText)', () => {
    const onSubmit = jest.fn();
    const onChangeText = jest.fn();
    const onOpenEmoteSheet = jest.fn();

    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        <ChatInputSection
          messageInput='hello'
          onChangeText={onChangeText}
          onSubmit={onSubmit}
          onOpenEmoteSheet={onOpenEmoteSheet}
          onOpenSettingsSheet={jest.fn()}
          replyTo={null}
          onClearReply={jest.fn()}
          connection={{
            isConnected: true,
            isAuthenticated: true,
            isSending: false,
          }}
        />
      </SafeAreaProvider>,
    );

    const props = mockChatComposer.mock.calls[0]?.[0] as {
      onSubmit?: () => void;
      onPressAdd?: () => void;
      onChangeText?: (text: string) => void;
      canSend?: boolean;
      editable?: boolean;
    };
    expect({
      onSubmit: props.onSubmit,
      onPressAdd: props.onPressAdd,
      onChangeText: props.onChangeText,
      canSend: props.canSend,
      editable: props.editable,
    }).toEqual({
      onSubmit,
      onPressAdd: onOpenEmoteSheet,
      onChangeText,
      canSend: true,
      editable: true,
    });
  });
});
