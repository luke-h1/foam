import { useImperativeHandle } from 'react';
import { TextInput as MockTextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { render } from '@testing-library/react-native';

import type { ChatComposerProps } from '../ChatComposer/ChatComposer';
import * as chatComposerModule from '../ChatComposer/ChatComposer';
import { ChatInputSection } from '../ChatInputSection';

const mockChatComposer = jest.fn((_props: ChatComposerProps) => {});

/**
 * `ChatComposer` is memo()-wrapped, so spyOn refuses to patch it; redefine
 * the export. The suite only checks prop wiring, not composer behavior.
 */
function MockChatComposer(props: ChatComposerProps) {
  mockChatComposer(props);
  useImperativeHandle(props.ref, () => ({
    focus: jest.fn(),
    blur: jest.fn(),
    setText: jest.fn(),
  }));
  return <MockTextInput testID='chat-composer' />;
}

Object.defineProperty(chatComposerModule, 'ChatComposer', {
  configurable: true,
  value: MockChatComposer,
});

function firstComposerProps(): ChatComposerProps {
  const props = mockChatComposer.mock.calls[0]?.[0];
  if (props === undefined) {
    throw new Error('ChatComposer was never rendered');
  }
  return props;
}

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

    const props = firstComposerProps();
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

  function renderWithConnection(props: {
    messageInput: string;
    isAuthenticated: boolean;
  }) {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        <ChatInputSection
          messageInput={props.messageInput}
          onChangeText={jest.fn()}
          onSubmit={jest.fn()}
          onOpenEmoteSheet={jest.fn()}
          onOpenSettingsSheet={jest.fn()}
          replyTo={null}
          onClearReply={jest.fn()}
          connection={{
            isConnected: true,
            isAuthenticated: props.isAuthenticated,
            isSending: false,
          }}
        />
      </SafeAreaProvider>,
    );
    return firstComposerProps();
  }

  test('keeps the composer editable and allows /refresh when signed out', () => {
    const props = renderWithConnection({
      messageInput: '/refresh',
      isAuthenticated: false,
    });
    expect({ canSend: props.canSend, editable: props.editable }).toEqual({
      canSend: true,
      editable: true,
    });
  });

  test('blocks sending a normal message when signed out', () => {
    const props = renderWithConnection({
      messageInput: 'hello there',
      isAuthenticated: false,
    });
    expect({ canSend: props.canSend, editable: props.editable }).toEqual({
      canSend: false,
      editable: true,
    });
  });
});
