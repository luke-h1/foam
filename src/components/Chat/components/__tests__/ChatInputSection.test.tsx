import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatInputSection } from '../ChatInputSection';

const mockChatComposer = jest.fn();

jest.mock('../ChatComposer/ChatComposer', () => {
  const React = require('react');
  const { TextInput: MockTextInput } = require('react-native');

  return {
    ChatComposer: React.forwardRef((props: unknown, ref: unknown) => {
      mockChatComposer(props);
      return (
        <MockTextInput
          ref={ref}
          testID='chat-composer'
          {...(props as object)}
        />
      );
    }),
  };
});

describe('ChatInputSection', () => {
  beforeEach(() => {
    mockChatComposer.mockClear();
  });

  test('configures chat submit to blur and dismiss the keyboard', () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        <ChatInputSection
          messageInput='hello'
          onChangeText={jest.fn()}
          onEmoteSelect={jest.fn()}
          onSubmit={jest.fn()}
          onOpenEmoteSheet={jest.fn()}
          onOpenSettingsSheet={jest.fn()}
          replyTo={null}
          onClearReply={jest.fn()}
          isConnected
          isAuthenticated
        />
      </SafeAreaProvider>,
    );

    expect(mockChatComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        blurOnSubmit: true,
        returnKeyType: 'send',
        submitBehavior: 'blurAndSubmit',
      }),
    );
  });
});
