import { useImperativeHandle } from 'react';
import { TextInput as MockTextInput } from 'react-native';
import * as keyboardControllerModule from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { act, render } from '@testing-library/react-native';

import * as useChatImageUploadModule from '@app/components/Chat/hooks/useChatImageUpload';
import { createTestUser } from '@app/context/__tests__/__fixtures__/authContext.fixture';
import * as twitchChatServiceModule from '@app/services/twitch-chat-service';
import type { UserInfoResponse } from '@app/types/twitch/user';

import type { ChatComposerProps } from '../ChatComposer/ChatComposer';
import * as chatComposerModule from '../ChatComposer/ChatComposer';
import { ChatInputShell } from '../ChatInputShell';

const mockChatComposer = jest.fn((_props: ChatComposerProps) => {});

/**
 * `ChatComposer` is `memo()`-wrapped, so it's an object rather than a plain
 * function and `jest.spyOn` refuses to patch it ("not a function"). Redefine
 * the export directly instead - this suite only cares that `ChatInputShell`
 * wires the right props through, not the real composer's rich-text behavior.
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

/**
 * `ChatInputShell` dismisses the keyboard on submit via
 * `KeyboardController.dismiss`; give the mocked call a resolved promise so
 * the `void`-called dismiss doesn't leave an unresolved awaiter around.
 */
jest
  .spyOn(keyboardControllerModule.KeyboardController, 'dismiss')
  .mockResolvedValue(undefined);

jest.spyOn(twitchChatServiceModule, 'getChatUserState').mockReturnValue({});

jest.spyOn(useChatImageUploadModule, 'useChatImageUpload').mockReturnValue({
  isUploading: false,
  pickAndUpload: jest.fn(),
});

type RenderedComposerProps = ChatComposerProps & {
  onChangeText: (text: string) => void;
  onSubmit: () => void;
};

function latestComposerProps(): RenderedComposerProps {
  const props = mockChatComposer.mock.calls.at(-1)?.[0];
  if (props?.onChangeText === undefined || props.onSubmit === undefined) {
    throw new Error('ChatComposer was not rendered with its editing API');
  }
  return {
    ...props,
    onChangeText: props.onChangeText,
    onSubmit: props.onSubmit,
  };
}

function renderShell(props: {
  onRefreshCommand?: jest.Mock;
  user?: UserInfoResponse;
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
        isChatConnected={() => true}
        onOpenEmoteSheet={jest.fn()}
        onOpenSettingsSheet={jest.fn()}
        onRefreshCommand={props.onRefreshCommand ?? jest.fn()}
        processMessageEmotes={jest.fn()}
        sendMessage={jest.fn()}
        user={props.user}
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
      user: createTestUser({
        id: '1',
        login: 'someone',
        display_name: 'Someone',
      }),
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
