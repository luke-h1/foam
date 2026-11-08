import { act, fireEvent, screen } from '@testing-library/react-native';

import { createMessageActionData } from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import * as runModCommandModule from '@app/components/chat/util/mod-commands/runModCommand';
import { userInfoFixture } from '@app/services/__fixtures__/twitch/user-info.fixture';
import { twitchService } from '@app/services/twitch-service';
import {
  openChatMessageActions,
  openChatUserActions,
  resetChatOverlays,
} from '@app/store/chat/actions/chat-overlays';
import * as showActionMenuModule from '@app/store/overlays/show-action-menu';
import render from '@app/test/render';

import { ChatOverlayLayer } from '../ChatOverlayLayer';

jest.spyOn(twitchService, 'getUser').mockResolvedValue(userInfoFixture);

const showActionMenuMock = jest
  .spyOn(showActionMenuModule, 'showActionMenu')
  .mockImplementation(() => {});

const runModCommandMock = jest
  .spyOn(runModCommandModule, 'runModCommand')
  .mockImplementation(() => {});

const CHANNEL_ID = 'channel-1';

function renderOverlayLayer() {
  return render(
    <ChatOverlayLayer
      canModerateChat
      channelId={CHANNEL_ID}
      channelName='channel'
      currentUserId='mod-1'
      hiddenUsers={[]}
      highlightedUsers={[]}
      hidePhraseFromView={jest.fn()}
      hideUserFromView={jest.fn()}
      onAppendMention={jest.fn()}
      onClearChatCache={jest.fn()}
      onClearImageCache={jest.fn()}
      onClearSevenTvCosmeticsCache={jest.fn()}
      onInsertEmote={jest.fn()}
      onInsertPhrase={jest.fn()}
      onPinMessage={jest.fn()}
      onRefreshPinnedMessage={jest.fn()}
      onReply={jest.fn()}
      onSettingsReconnect={jest.fn()}
      onSettingsRefetchEmotes={jest.fn()}
      onUnpinPinnedMessage={jest.fn()}
      pinnedMessageBusy={false}
      toggleHighlightedUser={jest.fn()}
    />,
  );
}

function pickDurationOption(index: number) {
  const menu = showActionMenuMock.mock.calls.at(0)?.[0];

  if (!menu) {
    throw new Error('showActionMenu was not called with options');
  }

  const option = menu.actions[index];

  if (!option) {
    throw new Error(`expected a duration option at index ${index}`);
  }

  act(() => {
    option.onPress();
  });

  return menu;
}

describe('ChatOverlayLayer moderation targets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetChatOverlays(CHANNEL_ID);
  });

  test('timeout prompts for a duration and runs the chosen one', () => {
    renderOverlayLayer();

    act(() => {
      openChatUserActions(CHANNEL_ID, { login: 'viewer', username: 'Viewer' });
    });

    fireEvent.press(screen.getByText('Time out…'));

    expect(runModCommandMock).not.toHaveBeenCalled();

    expect(showActionMenuMock).toHaveBeenCalledTimes(1);

    const menu = pickDurationOption(3);
    expect(menu.title).toBe('Timeout viewer');

    expect(menu.actions.map(action => action.label)).toEqual([
      '10 seconds',
      '1 minute',
      '10 minutes',
      '30 minutes',
      '1 hour',
      '24 hours',
    ]);

    expect(runModCommandMock).toHaveBeenCalledTimes(1);

    expect(runModCommandMock.mock.calls[0]).toEqual([
      { type: 'timeout', login: 'viewer', durationSeconds: 1800 },
      CHANNEL_ID,
      'mod-1',
    ]);
  });

  test('timeout from the message sheet targets the message author', () => {
    renderOverlayLayer();

    act(() => {
      openChatMessageActions(CHANNEL_ID, createMessageActionData());
    });

    fireEvent.press(screen.getByText('Time out…'));

    pickDurationOption(1);

    expect(runModCommandMock).toHaveBeenCalledTimes(1);

    expect(runModCommandMock.mock.calls[0]).toEqual([
      { type: 'timeout', login: 'Viewer', durationSeconds: 60 },
      CHANNEL_ID,
      'mod-1',
    ]);
  });

  test('ban runs immediately without a duration menu', () => {
    renderOverlayLayer();

    act(() => {
      openChatUserActions(CHANNEL_ID, { login: 'viewer', username: 'Viewer' });
    });

    fireEvent.press(screen.getByText('Ban user'));

    expect(showActionMenuMock).not.toHaveBeenCalled();

    expect(runModCommandMock).toHaveBeenCalledTimes(1);

    expect(runModCommandMock.mock.calls[0]).toEqual([
      { type: 'ban', login: 'viewer' },
      CHANNEL_ID,
      'mod-1',
    ]);
  });

  test('a selection made on another channel is not shown here', () => {
    renderOverlayLayer();

    act(() => {
      openChatUserActions('other-channel', {
        login: 'viewer',
        username: 'Viewer',
      });
    });

    expect(screen.queryByText('Ban user')).not.toBeOnTheScreen();
  });
});
