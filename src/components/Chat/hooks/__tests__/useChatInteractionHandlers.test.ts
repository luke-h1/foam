import { act, renderHook } from '@testing-library/react-native';

import type { ChatInputShellHandle } from '@app/components/Chat/components/ChatInputShell';
import type { EmotePressData } from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';
import type { ChatOverlayOpeners } from '@app/components/Chat/components/useChatOverlays';
import { getMessageById } from '@app/store/chat/actions/messages';
import { createRef } from '@app/test/createRef';
import { createEmotePart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import {
  useChatComposerActions,
  useChatOverlayActions,
} from '../useChatInteractionHandlers';
import { createChatMessage } from './__fixtures__/useChat.fixture';

jest.mock('@app/store/chat/actions/messages', () => ({
  getMessageById: jest.fn(),
}));

const mockGetMessageById = jest.mocked(getMessageById);

function renderComposerActions() {
  const fetchUserCosmetics = jest.fn(() => Promise.resolve());
  const inputShell = {
    appendEmote: jest.fn(),
    appendMention: jest.fn(),
    insertPhrase: jest.fn(),
    clearReply: jest.fn(),
    setReplyTo: jest.fn(),
  };

  const hook = renderHook(() =>
    useChatComposerActions({
      fetchUserCosmetics,
      inputShellRef: createRef<ChatInputShellHandle | null>(inputShell),
    }),
  );

  return {
    fetchUserCosmetics,
    hook,
    inputShell,
  };
}

function renderOverlayActions() {
  const openBadge = jest.fn();
  const openChattersSheet = jest.fn();
  const openEmotePreview = jest.fn();
  const openEmoteSheet = jest.fn();
  const openMessageActions = jest.fn();
  const openSavedPhrasesSheet = jest.fn();
  const openSettingsSheet = jest.fn();
  const openUserActions = jest.fn();
  const openers: ChatOverlayOpeners = {
    openBadge,
    openChattersSheet,
    openEmotePreview,
    openEmoteSheet,
    openMessageActions,
    openSavedPhrasesSheet,
    openSettingsSheet,
    openUserActions,
  };

  const hook = renderHook(() => useChatOverlayActions(openers));

  return {
    hook,
    openBadge,
    openEmotePreview,
    openEmoteSheet,
    openMessageActions,
    openSettingsSheet,
    openUserActions,
  };
}

describe('useChatComposerActions', () => {
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
    const { fetchUserCosmetics, hook, inputShell } = renderComposerActions();

    act(() => {
      hook.result.current.handleReply(replyMessage);
    });

    expect(fetchUserCosmetics).toHaveBeenCalledWith('viewer-user');
    expect(mockGetMessageById).toHaveBeenCalledWith('reply-1');
    expect(inputShell.setReplyTo.mock.calls[0]?.[0]).toEqual({
      color: '#00ff00',
      message: 'replying with Kappa',
      messageParts: replyMessage.message,
      messageId: 'reply-1',
      parentMessage: 'parent text OMEGALUL',
      replyParentUserLogin: 'Viewer',
      userId: 'viewer-user',
      username: 'Viewer',
    });
  });

  test('inserts emotes and mentions into the composer', () => {
    const { hook, inputShell } = renderComposerActions();

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
      hook.result.current.insertPhraseToComposer('be right back');
    });

    expect(inputShell.appendEmote.mock.calls).toEqual([
      ['Kappa'],
      ['OMEGALUL'],
    ]);
    expect(inputShell.appendMention).toHaveBeenCalledWith('targetUser');
    expect(inputShell.insertPhrase).toHaveBeenCalledWith('be right back');
  });
});

describe('useChatOverlayActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('opens overlay surfaces for emotes, message actions, settings, and users', () => {
    const message = createChatMessage();
    const {
      hook,
      openEmotePreview,
      openEmoteSheet,
      openMessageActions,
      openSettingsSheet,
      openUserActions,
    } = renderOverlayActions();
    const emote: EmotePressData = createEmotePart('Kappa', {
      name: 'Kappa',
      original_name: 'Kappa',
      site: '7TV Channel',
      url: 'https://cdn.example.test/kappa.webp',
      creator: null,
      emote_link: 'https://cdn.example.test/kappa.webp',
    });
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

    expect(openEmoteSheet).toHaveBeenCalledTimes(1);
    expect(openSettingsSheet).toHaveBeenCalledTimes(1);
    expect(openEmotePreview.mock.calls[0]?.[0]).toEqual(emote);
    expect(openMessageActions.mock.calls[0]?.[0]).toEqual(
      createMessageActionPayload(message),
    );
    expect(openUserActions.mock.calls[0]?.[0]).toEqual(usernameData);
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
