import { createRef, type RefObject, useImperativeHandle } from 'react';
import { TextInput as MockTextInput } from 'react-native';
import * as keyboardControllerModule from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { act, render } from '@testing-library/react-native';

import * as useChatImageUploadModule from '@app/components/chat/hooks/use-chat-image-upload';
import * as chatUserStateModule from '@app/components/chat/util/chat-user-state';
import { createTestUser } from '@app/context/__tests__/__fixtures__/auth-context.fixture';
import {
  clearUserCosmeticsCache,
  setUserBadge,
} from '@app/store/chat/actions/cosmetics';
import { getPreferences, preferences$ } from '@app/store/preference-store';
import { TEST_SAFE_AREA_METRICS } from '@app/test/safe-area';
import type { UserInfoResponse } from '@app/types/twitch/user';

import type { ChatComposerProps } from '../chat-composer/ChatComposer';
import * as chatComposerModule from '../chat-composer/ChatComposer';
import { ChatInputShell, type ChatInputShellHandle } from '../ChatInputShell';

const mockChatComposer = jest.fn((_props: ChatComposerProps) => {});
const mockSetText = jest.fn((_text: string) => {});

/**
 * `ChatComposer` is memo()-wrapped, so spyOn refuses to patch it; redefine
 * the export. The suite only checks prop wiring, not composer behavior.
 */
function MockChatComposer(props: ChatComposerProps) {
  mockChatComposer(props);

  useImperativeHandle(props.ref, () => ({
    focus: jest.fn(),
    blur: jest.fn(),
    setText: mockSetText,
  }));

  return <MockTextInput testID='chat-composer' />;
}

Object.defineProperty(chatComposerModule, 'ChatComposer', {
  configurable: true,
  value: MockChatComposer,
});

/**
 * Give the mocked `KeyboardController.dismiss` a resolved promise so the
 * void-called dismiss leaves no unresolved awaiter.
 */
jest
  .spyOn(keyboardControllerModule.KeyboardController, 'dismiss')
  .mockResolvedValue(undefined);

jest.spyOn(chatUserStateModule, 'getChatUserState').mockReturnValue({});

jest.spyOn(useChatImageUploadModule, 'useChatImageUpload').mockReturnValue({
  isUploading: false,
  pickAndUpload: jest.fn(),
});

interface RenderedComposerProps extends ChatComposerProps {
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

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

interface RenderShellOptions {
  onRefreshCommand?: jest.Mock;
  processMessageEmotes?: jest.Mock;
  shellRef?: RefObject<ChatInputShellHandle | null>;
  user?: UserInfoResponse;
}

function renderShell(props: RenderShellOptions) {
  render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <ChatInputShell
        channelId='123'
        channelName='testchannel'
        isChatConnected={() => true}
        ref={props.shellRef}
        {...{
          onOpenEmoteSheet: jest.fn(),
          onOpenSettingsSheet: jest.fn(),
          onRefreshCommand: props.onRefreshCommand ?? jest.fn(),
          processMessageEmotes: props.processMessageEmotes ?? jest.fn(),
          sendMessage: jest.fn(),
          user: props.user,
        }}
      />
    </SafeAreaProvider>,
  );
}

describe('ChatInputShell', () => {
  beforeEach(() => {
    mockChatComposer.mockClear();
    mockSetText.mockClear();
  });

  test('appending an emote after a trailing space adds no second space', () => {
    const shellRef = createRef<ChatInputShellHandle>();

    renderShell({
      shellRef,
      user: createTestUser({
        id: '1',
        login: 'someone',
        display_name: 'Someone',
      }),
    });

    act(() => {
      latestComposerProps().onChangeText('hello ');
    });

    act(() => {
      shellRef.current?.appendEmote('KEKW');
    });

    expect(mockSetText.mock.calls.at(-1)?.[0]).toEqual('hello KEKW ');
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

  test('the optimistic own message leaves out the 7TV badge when 7TV badges are off', () => {
    const show7tvBadges = getPreferences().show7tvBadges;
    const processMessageEmotes = jest.fn();

    preferences$.show7tvBadges.set(false);
    setUserBadge('1', 'badge-paint');

    renderShell({
      processMessageEmotes,
      user: createTestUser({
        id: '1',
        login: 'someone',
        display_name: 'Someone',
      }),
    });

    act(() => {
      latestComposerProps().onChangeText('hello');
    });

    act(() => {
      latestComposerProps().onSubmit();
    });

    preferences$.show7tvBadges.set(show7tvBadges);
    clearUserCosmeticsCache();

    expect(processMessageEmotes.mock.calls[0]?.[2]?.badges).toEqual([]);
  });
});
