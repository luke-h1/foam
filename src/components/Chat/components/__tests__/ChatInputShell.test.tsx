import { SafeAreaProvider } from 'react-native-safe-area-context';

import { act, render } from '@testing-library/react-native';

import type { ChatComposerProps } from '../ChatComposer/ChatComposer';
import { ChatInputShell } from '../ChatInputShell';

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

jest.mock('react-native-keyboard-controller', () => ({
  KeyboardController: {
    dismiss: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../hooks/useChatImageUpload', () => ({
  useChatImageUpload: () => ({
    isUploading: false,
    pickAndUpload: jest.fn(),
  }),
}));

function latestComposerProps() {
  return mockChatComposer.mock.calls.at(-1)?.[0] as {
    onChangeText: (text: string) => void;
    onSubmit: () => void;
    canSend?: boolean;
    editable?: boolean;
  };
}

function renderShell(props: {
  onRefreshCommand?: jest.Mock;
  user?: { id: string; login: string; display_name: string };
}) {
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { bottom: 0, left: 0, right: 0, top: 0 },
      }}
    >
      <ChatInputShell
        channelId='123'
        channelName='testchannel'
        connected
        getUserState={() => ({})}
        isChatConnected={() => true}
        onOpenEmoteSheet={jest.fn()}
        onOpenSettingsSheet={jest.fn()}
        onRefreshCommand={props.onRefreshCommand ?? jest.fn()}
        processMessageEmotes={jest.fn()}
        sendMessage={jest.fn()}
        user={props.user as never}
      />
    </SafeAreaProvider>,
  );
}

describe('ChatInputShell', () => {
  beforeEach(() => {
    mockChatComposer.mockClear();
  });

  test('typed /refresh while signed out reaches canSend and runs the refresh', () => {
    const onRefreshCommand = jest.fn();
    renderShell({ onRefreshCommand, user: undefined });

    expect(latestComposerProps().canSend).toBe(false);

    act(() => {
      latestComposerProps().onChangeText('/refresh');
    });

    expect(latestComposerProps().canSend).toBe(true);

    act(() => {
      latestComposerProps().onSubmit();
    });

    expect(onRefreshCommand).toHaveBeenCalledTimes(1);
  });

  test('/refresh with trailing text still refreshes instead of toasting usage', () => {
    const onRefreshCommand = jest.fn();
    renderShell({
      onRefreshCommand,
      user: { id: '1', login: 'someone', display_name: 'Someone' },
    });

    act(() => {
      latestComposerProps().onChangeText('/refresh please');
    });

    act(() => {
      latestComposerProps().onSubmit();
    });

    expect(onRefreshCommand).toHaveBeenCalledTimes(1);
  });

  test('typed text while signed out is tracked but normal messages stay blocked', () => {
    renderShell({ user: undefined });

    act(() => {
      latestComposerProps().onChangeText('hello there');
    });

    expect(latestComposerProps().canSend).toBe(false);
  });
});
