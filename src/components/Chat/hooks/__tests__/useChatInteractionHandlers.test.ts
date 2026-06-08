import { getMessageById } from '@app/store/chat/actions/messages';
import { act, renderHook } from '@testing-library/react-native';
import type { ChatInputShellHandle } from '../../ChatInputShell';
import type { ChatOverlaysHandle } from '../../ChatOverlays';
import { createChatMessage } from './__fixtures__/useChat.fixture';
import { useChatInteractionHandlers } from '../useChatInteractionHandlers';

jest.mock('@app/store/chat/actions/messages', () => ({
  getMessageById: jest.fn(),
}));

const mockGetMessageById = jest.mocked(getMessageById);

function renderInteractionHandlers() {
  const fetchUserCosmetics = jest.fn(() => Promise.resolve());
  const inputShell = {
    appendEmote: jest.fn(),
    appendMention: jest.fn(),
    prepareTimeoutCommand: jest.fn(),
    setReplyTo: jest.fn(),
  };
  const chatOverlays = {
    openEmotePreview: jest.fn(),
    openEmoteSheet: jest.fn(),
    openMessageActions: jest.fn(),
    openSettingsSheet: jest.fn(),
    openUserActions: jest.fn(),
  };

  const hook = renderHook(() =>
    useChatInteractionHandlers({
      fetchUserCosmetics,
      inputShellRef: {
        current: inputShell as unknown as ChatInputShellHandle,
      },
      chatOverlaysRef: {
        current: chatOverlays as ChatOverlaysHandle,
      },
    }),
  );

  return {
    chatOverlays,
    fetchUserCosmetics,
    hook,
    inputShell,
  };
}

describe('useChatInteractionHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets composer reply context from the selected chat message and parent message', () => {
    const parentMessage = createChatMessage({
      text: 'parent text OMEGALUL',
      tags: {
        id: 'parent-1',
        login: 'parent',
        'display-name': 'Parent',
        'user-id': 'parent-user',
      },
    });
    const replyMessage = createChatMessage({
      text: 'replying with Kappa',
      tags: {
        id: 'reply-1',
        login: 'viewer',
        'display-name': 'Viewer',
        'user-id': 'viewer-user',
        color: '#00ff00',
      },
    });
    mockGetMessageById.mockReturnValue(parentMessage);
    const { fetchUserCosmetics, hook, inputShell } =
      renderInteractionHandlers();

    act(() => {
      hook.result.current.handleReply(replyMessage);
    });

    expect(fetchUserCosmetics).toHaveBeenCalledWith('viewer-user');
    expect(mockGetMessageById).toHaveBeenCalledWith('reply-1');
    expect(inputShell.setReplyTo.mock.calls[0]?.[0]).toEqual({
      color: '#00ff00',
      message: 'replying with Kappa',
      messageId: 'reply-1',
      parentMessage: 'parent text OMEGALUL',
      replyParentUserLogin: 'Viewer',
      userId: 'viewer-user',
      username: 'Viewer',
    });
  });

  test('inserts emotes and mentions into the composer', () => {
    const { hook, inputShell } = renderInteractionHandlers();

    act(() => {
      hook.result.current.handleEmoteSelect('Kappa');
      hook.result.current.handleEmoteSelect({
        id: 'emote-1',
        name: 'OMEGALUL',
        original_name: 'OMEGALUL',
        url: 'https://cdn.example.test/omegalul.webp',
        creator: null,
        emote_link: 'https://7tv.app/emotes/emote-1',
        site: 'BTTV',
      });
      hook.result.current.appendMentionToComposer('targetUser');
    });

    expect(inputShell.appendEmote.mock.calls).toEqual([
      ['Kappa'],
      ['OMEGALUL'],
    ]);
    expect(inputShell.appendMention).toHaveBeenCalledWith('targetUser');

    act(() => {
      hook.result.current.prepareTimeoutCommand('targetUser');
    });

    expect(inputShell.prepareTimeoutCommand).toHaveBeenCalledWith('targetUser');
  });

  test('opens overlay surfaces for emotes, message actions, settings, and users', () => {
    const message = createChatMessage();
    const { chatOverlays, hook } = renderInteractionHandlers();
    const emote = {
      id: 'emote-1',
      name: 'Kappa',
      url: 'https://cdn.example.test/kappa.webp',
    };
    const usernameData = {
      username: 'Viewer',
      displayName: 'Viewer',
      userId: 'user-1',
      color: '#9146ff',
    };

    act(() => {
      hook.result.current.handleOpenEmoteSheet();
      hook.result.current.handleOpenSettingsSheet();
      hook.result.current.handleEmotePress(emote);
      hook.result.current.handleMessageLongPress(
        createMessageActionPayload(message),
      );
      hook.result.current.handleUsernamePress(usernameData);
    });

    expect(chatOverlays.openEmoteSheet).toHaveBeenCalledTimes(1);
    expect(chatOverlays.openSettingsSheet).toHaveBeenCalledTimes(1);
    expect(chatOverlays.openEmotePreview.mock.calls[0]?.[0]).toEqual(emote);
    expect(chatOverlays.openMessageActions.mock.calls[0]?.[0]).toEqual(
      createMessageActionPayload(message),
    );
    expect(chatOverlays.openUserActions.mock.calls[0]?.[0]).toEqual(
      usernameData,
    );
  });
});

function createMessageActionPayload(
  message: ReturnType<typeof createChatMessage>,
) {
  return {
    badges: message.badges,
    color: message.userstate.color,
    message: message.message,
    messageData: message,
    username: message.sender,
    userstate: message.userstate,
  };
}
