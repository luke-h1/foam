import { useEffect } from 'react';

import { act } from '@testing-library/react-native';

import { runModCommand } from '@app/components/Chat/util/runModCommand';
import render from '@app/test/render';
import { showActionMenu } from '@app/utils/actionMenu/showActionMenu';

import { type ChatOverlayOpeners, useChatOverlays } from '../useChatOverlays';

interface CapturedLayerProps {
  onBanSelectedUser: () => void;
  onTimeoutSelectedUser: () => void;
  selectedUser: { username: string } | null;
}

let mockLayerProps: CapturedLayerProps | undefined;

jest.mock('../ChatOverlayLayer', () => ({
  ChatOverlayLayer: (props: CapturedLayerProps) => {
    mockLayerProps = props;
    return null;
  },
}));

jest.mock('@app/utils/actionMenu/showActionMenu', () => ({
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
    chatDensity: 'comfortable',
    currentUserId: 'mod-1',
    disableEmoteAnimations: false,
    handleReply: jest.fn(),
    hiddenUsers: [],
    hidePhraseFromView: jest.fn(),
    hideUserFromView: jest.fn(),
    highlightOwnMentions: false,
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
    onToggleChatDensity: jest.fn(),
    onToggleHighlightOwnMentions: jest.fn(),
    onToggleInlineReplyContext: jest.fn(),
    onToggleShowTimestamps: jest.fn(),
    onToggleShowUnreadJumpPill: jest.fn(),
    onUnpinPinnedMessage: jest.fn(),
    pinnedMessageBusy: false,
    showInlineReplyContext: true,
    showTimestamps: false,
    showUnreadJumpPill: true,
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
    expect(mockLayerProps?.selectedUser).toBeNull();
  });

  test('cancelling the duration menu keeps the user selected and runs nothing', () => {
    const layerProps = renderOverlaysWithSelectedUser();

    act(() => {
      layerProps.onTimeoutSelectedUser();
    });

    expect(runModCommandMock).not.toHaveBeenCalled();
    expect(mockLayerProps?.selectedUser).toEqual({
      login: 'viewer',
      username: 'Viewer',
    });
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
    expect(mockLayerProps?.selectedUser).toBeNull();
  });
});
