import { useEffect } from 'react';

import { act } from '@testing-library/react-native';

import { createMessageActionData } from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';
import { runModCommand } from '@app/components/Chat/util/runModCommand';
import { showActionMenu } from '@app/store/overlays/showActionMenu';
import render from '@app/test/render';

import type { UsernamePressData } from '../ChatMessage/RichChatMessage';
import { type ChatOverlayOpeners, useChatOverlays } from '../useChatOverlays';

interface CapturedLayerProps {
  onActionSheetTimeoutUser: () => void;
  onBanSelectedUser: () => void;
  onCloseSelectedMessage: () => void;
  onCloseSelectedUser: () => void;
  onTimeoutSelectedUser: () => void;
  selectedMessage: { username?: string } | null;
  selectedUser: { username: string } | null;
}

let mockLayerProps: CapturedLayerProps | undefined;

jest.mock('../ChatOverlayLayer', () => ({
  ChatOverlayLayer: (props: CapturedLayerProps) => {
    mockLayerProps = props;
    return null;
  },
}));

jest.mock('@app/store/overlays/showActionMenu', () => ({
  showActionMenu: jest.fn(),
}));

jest.mock('@app/components/Chat/util/runModCommand', () => ({
  runModCommand: jest.fn(),
}));

const showActionMenuMock = jest.mocked(showActionMenu);
const runModCommandMock = jest.mocked(runModCommand);

function Harness({
  onReady,
}: {
  onReady: (openers: ChatOverlayOpeners) => void;
}) {
  const { openers, overlaysElement } = useChatOverlays({
    appendMentionToComposer: jest.fn(),
    canModerateChat: true,
    channelId: 'channel-1',
    currentUserId: 'mod-1',
    handleReply: jest.fn(),
    hiddenUsers: [],
    hidePhraseFromView: jest.fn(),
    hideUserFromView: jest.fn(),
    highlightedUsers: [],
    insertPhraseToComposer: jest.fn(),
    onClearChatCache: jest.fn(),
    onClearImageCache: jest.fn(),
    onClearSevenTvCosmeticsCache: jest.fn(),
    onInsertEmote: jest.fn(),
    onPinMessage: jest.fn(),
    onRefreshPinnedMessage: jest.fn(),
    onSettingsReconnect: jest.fn(),
    onSettingsRefetchEmotes: jest.fn(),
    onUnpinPinnedMessage: jest.fn(),
    pinnedMessageBusy: false,
    toggleHighlightedUser: jest.fn(),
  });

  useEffect(() => {
    onReady(openers);
  }, [onReady, openers]);

  return overlaysElement;
}

function renderOverlaysWithSelectedUser(): CapturedLayerProps {
  let openers: ChatOverlayOpeners | undefined;
  render(
    <Harness
      onReady={ready => {
        openers = ready;
      }}
    />,
  );
  if (!openers) {
    throw new Error('useChatOverlays openers were not captured');
  }
  const readyOpeners = openers;

  act(() => {
    readyOpeners.openUserActions({ login: 'viewer', username: 'Viewer' });
  });
  if (!mockLayerProps) {
    throw new Error('ChatOverlayLayer props were not captured');
  }
  return mockLayerProps;
}

describe('useChatOverlays moderation targets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLayerProps = undefined;
  });

  test('timeout prompts for a duration and runs the chosen one', () => {
    const layerProps = renderOverlaysWithSelectedUser();

    act(() => {
      layerProps.onTimeoutSelectedUser();
    });

    expect(runModCommandMock).not.toHaveBeenCalled();
    expect(showActionMenuMock).toHaveBeenCalledTimes(1);

    const menu = showActionMenuMock.mock.calls.at(0)?.[0];
    if (!menu) {
      throw new Error('showActionMenu was not called with options');
    }
    expect(menu.title).toBe('Timeout viewer');
    expect(menu.actions.map(action => action.label)).toEqual([
      '10 seconds',
      '1 minute',
      '10 minutes',
      '30 minutes',
      '1 hour',
      '24 hours',
    ]);

    const thirtyMinutes = menu.actions[3];
    if (!thirtyMinutes) {
      throw new Error('expected a 30 minute duration option');
    }
    act(() => {
      thirtyMinutes.onPress();
    });

    expect(runModCommandMock).toHaveBeenCalledTimes(1);
    expect(runModCommandMock.mock.calls[0]).toEqual([
      { type: 'timeout', login: 'viewer', durationSeconds: 1800 },
      'channel-1',
      'mod-1',
    ]);
    expect(mockLayerProps?.selectedUser).toEqual<UsernamePressData>({
      login: 'viewer',
      username: 'Viewer',
    });

    act(() => {
      mockLayerProps?.onCloseSelectedUser();
    });
    expect(mockLayerProps?.selectedUser).toBeNull();
  });

  test('opening the duration menu keeps the user selected until a duration is chosen', () => {
    const layerProps = renderOverlaysWithSelectedUser();

    act(() => {
      layerProps.onTimeoutSelectedUser();
    });

    expect(runModCommandMock).not.toHaveBeenCalled();
    expect(mockLayerProps?.selectedUser).toEqual<UsernamePressData>({
      login: 'viewer',
      username: 'Viewer',
    });
  });

  test('timeout from the message sheet targets the author; selection clears on sheet dismiss', () => {
    let openers: ChatOverlayOpeners | undefined;
    render(
      <Harness
        onReady={ready => {
          openers = ready;
        }}
      />,
    );
    if (!openers) {
      throw new Error('useChatOverlays openers were not captured');
    }
    const readyOpeners = openers;

    act(() => {
      readyOpeners.openMessageActions(createMessageActionData());
    });
    if (!mockLayerProps) {
      throw new Error('ChatOverlayLayer props were not captured');
    }

    act(() => {
      mockLayerProps?.onActionSheetTimeoutUser();
    });

    const menu = showActionMenuMock.mock.calls.at(0)?.[0];
    if (!menu) {
      throw new Error('showActionMenu was not called with options');
    }
    const oneMinute = menu.actions[1];
    if (!oneMinute) {
      throw new Error('expected a 1 minute duration option');
    }
    act(() => {
      oneMinute.onPress();
    });

    expect(runModCommandMock).toHaveBeenCalledTimes(1);
    expect(runModCommandMock.mock.calls[0]).toEqual([
      { type: 'timeout', login: 'Viewer', durationSeconds: 60 },
      'channel-1',
      'mod-1',
    ]);
    expect(mockLayerProps?.selectedMessage).not.toBeNull();

    act(() => {
      mockLayerProps?.onCloseSelectedMessage();
    });
    expect(mockLayerProps?.selectedMessage).toBeNull();
  });

  test('ban runs immediately without a duration menu', () => {
    const layerProps = renderOverlaysWithSelectedUser();

    act(() => {
      layerProps.onBanSelectedUser();
    });

    expect(showActionMenuMock).not.toHaveBeenCalled();
    expect(runModCommandMock).toHaveBeenCalledTimes(1);
    expect(runModCommandMock.mock.calls[0]).toEqual([
      { type: 'ban', login: 'viewer' },
      'channel-1',
      'mod-1',
    ]);
    expect(mockLayerProps?.selectedUser).toEqual<UsernamePressData>({
      login: 'viewer',
      username: 'Viewer',
    });

    act(() => {
      mockLayerProps?.onCloseSelectedUser();
    });
    expect(mockLayerProps?.selectedUser).toBeNull();
  });
});
