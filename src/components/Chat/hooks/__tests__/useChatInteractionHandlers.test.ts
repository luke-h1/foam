import { act, renderHook } from '@testing-library/react-native';

import type { ReplyToData } from '@app/components/Chat/components/ChatInputSection';
import type { ChatInputShellHandle } from '@app/components/Chat/components/ChatInputShell';
import type { EmotePressData } from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';
import { resetChatOverlays } from '@app/store/chat/actions/chatOverlays';
import * as messagesActions from '@app/store/chat/actions/messages';
import * as userCosmeticsFetchActions from '@app/store/chat/actions/userCosmeticsFetch';
import { chatOverlays$ } from '@app/store/chat/observables/chatOverlays';
import { createRef } from '@app/test/createRef';
import { createEmotePart } from '@app/utils/chat/__tests__/__fixtures__/parsedPart.fixture';

import {
  useChatComposerActions,
  useChatOverlayActions,
} from '../useChatInteractionHandlers';
import { createChatMessage } from './__fixtures__/useChat.fixture';

const mockGetMessageById = jest.spyOn(messagesActions, 'getMessageById');
const mockFetchUserCosmetics = jest
  .spyOn(userCosmeticsFetchActions, 'fetchUserCosmetics')
  .mockResolvedValue(undefined);

function renderComposerActions() {
  const inputShell = {
    appendEmote: jest.fn(),
    appendMention: jest.fn(),
    insertPhrase: jest.fn(),
    clearReply: jest.fn(),
    setReplyTo: jest.fn(),
  };

  const hook = renderHook(() =>
    useChatComposerActions({
      inputShellRef: createRef<ChatInputShellHandle | null>(inputShell),
    }),
  );

  return {
    hook,
    inputShell,
  };
}

const CHANNEL_ID = 'channel-1';

function renderOverlayActions() {
  return renderHook(() => useChatOverlayActions(CHANNEL_ID));
}

describe('useChatComposerActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    messagesActions.clearMessages();
  });

  test('sets composer reply context from the selected chat message and parent message', () => {
    const storedReplyMessage = createChatMessage({
      text: 'parent text OMEGALUL',
      tags: {
        id: 'reply-1',
        login: 'parent',
        'display-name': 'Parent',
        'user-id': 'parent-user',
      },
    });
    messagesActions.addMessage(storedReplyMessage);
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
    const { hook, inputShell } = renderComposerActions();

    act(() => {
      hook.result.current.handleReply(replyMessage);
    });

    expect(mockFetchUserCosmetics).toHaveBeenCalledWith('viewer-user');
    expect(mockGetMessageById).toHaveBeenCalledWith('reply-1');
    expect(inputShell.setReplyTo.mock.calls[0]?.[0]).toEqual<ReplyToData>({
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
        provider: 'bttv',
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
    resetChatOverlays(CHANNEL_ID);
  });

  test('each press writes its surface to the overlay store', () => {
    const message = createChatMessage();
    const hook = renderOverlayActions();
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
    });
    expect(chatOverlays$.peek().isEmoteSheetMounted).toBe(true);

    act(() => {
      hook.result.current.handleOpenSettingsSheet();
    });
    expect(chatOverlays$.peek().isSettingsSheetMounted).toBe(true);
    // Opening a surface closes the previous one; only one sheet is ever up.
    expect(chatOverlays$.peek().isEmoteSheetMounted).toBe(false);

    act(() => {
      hook.result.current.handleEmotePress(emote);
    });
    expect(chatOverlays$.peek().selectedEmote).toEqual(emote);

    act(() => {
      hook.result.current.handleMessageLongPress(
        createMessageActionPayload(message),
      );
    });
    expect(chatOverlays$.peek().selectedMessage).toEqual(
      createMessageActionPayload(message),
    );

    act(() => {
      hook.result.current.handleUsernamePress(usernameData);
    });
    expect(chatOverlays$.peek().selectedUser).toEqual(usernameData);
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
