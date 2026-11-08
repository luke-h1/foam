import { useImperativeHandle } from 'react';
import { TextInput as MockTextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { render } from '@testing-library/react-native';

import { TEST_SAFE_AREA_METRICS } from '@app/test/safe-area';

import type { ChatComposerProps } from '../chat-composer/ChatComposer';
import * as chatComposerModule from '../chat-composer/ChatComposer';
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

  function renderWithConnection(props: {
    messageInput: string;
    isAuthenticated: boolean;
  }) {
    render(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <ChatInputSection
          messageInput={props.messageInput}
          onChangeText={jest.fn()}
          onSubmit={jest.fn()}
          onOpenEmoteSheet={jest.fn()}
          onOpenSettingsSheet={jest.fn()}
          replyTo={null}
          onClearReply={jest.fn()}
          isAuthenticated={props.isAuthenticated}
        />
      </SafeAreaProvider>,
    );

    return firstComposerProps();
  }

  test('allows sending a normal message when signed in', () => {
    const props = renderWithConnection({
      messageInput: 'hello there',
      isAuthenticated: true,
    });

    expect(props.canSend).toBe(true);
  });

  test('blocks sending a normal message when signed out', () => {
    const props = renderWithConnection({
      messageInput: 'hello there',
      isAuthenticated: false,
    });

    expect(props.canSend).toBe(false);
  });
});
