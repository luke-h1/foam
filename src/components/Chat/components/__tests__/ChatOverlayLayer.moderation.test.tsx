import { act } from '@testing-library/react-native';

import { createMessageActionData } from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';
import { runModCommand } from '@app/components/Chat/util/modCommands/runModCommand';
import {
  openChatMessageActions,
  openChatUserActions,
  resetChatOverlays,
} from '@app/store/chat/actions/chatOverlays';
import { showActionMenu } from '@app/store/overlays/showActionMenu';
import render from '@app/test/render';

import { ChatOverlayLayer } from '../ChatOverlayLayer';

interface CapturedUserSheetProps {
  onBanUser: () => void;
  onTimeoutUser: () => void;
}

interface CapturedMessageSheetProps {
  onTimeoutUser: () => void;
}

let userSheetProps: CapturedUserSheetProps | undefined;
let messageSheetProps: CapturedMessageSheetProps | undefined;

// The sheets present natively; this test is about which login each moderation
// action targets, so capture their callbacks rather than driving the UI.
jest.mock('../UserActionSheet', () => ({
  UserActionSheet: (props: CapturedUserSheetProps) => {
    userSheetProps = props;
    return null;
  },
}));

jest.mock('../ActionSheet/ActionSheet', () => ({
  ActionSheet: (props: CapturedMessageSheetProps) => {
    messageSheetProps = props;
    return null;
  },
}));

jest.mock('@app/store/overlays/showActionMenu', () => ({
  showActionMenu: jest.fn(),
}));

jest.mock('@app/components/Chat/util/modCommands/runModCommand', () => ({
  runModCommand: jest.fn(),
}));

const showActionMenuMock = jest.mocked(showActionMenu);
const runModCommandMock = jest.mocked(runModCommand);

const CHANNEL_ID = 'channel-1';

function renderOverlayLayer() {
  return render(
    <ChatOverlayLayer
      canModerateChat
      channelId={CHANNEL_ID}
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
    userSheetProps = undefined;
    messageSheetProps = undefined;
    resetChatOverlays(CHANNEL_ID);
  });

  test('timeout prompts for a duration and runs the chosen one', () => {
    renderOverlayLayer();

    act(() => {
      openChatUserActions(CHANNEL_ID, { login: 'viewer', username: 'Viewer' });
    });
    if (!userSheetProps) {
      throw new Error('UserActionSheet was not rendered');
    }

    act(() => {
      userSheetProps?.onTimeoutUser();
    });

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
    if (!messageSheetProps) {
      throw new Error('ActionSheet was not rendered');
    }

    act(() => {
      messageSheetProps?.onTimeoutUser();
    });

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

    act(() => {
      userSheetProps?.onBanUser();
    });

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

    expect(userSheetProps).toBeUndefined();
  });
});
