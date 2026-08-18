import { act, renderHook, waitFor } from '@testing-library/react-native';
import { toast } from 'sonner-native';

import { twitchService } from '@app/services/twitch-service';
import type { TwitchPinnedChatMessage } from '@app/types/twitch/chat';
import { logger } from '@app/utils/logger';

import type { PinnedChatMessageViewModel } from '../usePinnedChatMessage';
import { usePinnedChatMessage } from '../usePinnedChatMessage';
import {
  createChatMessage,
  createMessageActionData,
} from './__fixtures__/useChat.fixture';

jest.spyOn(logger.chat, 'debug').mockImplementation(() => {});
jest.spyOn(logger.chat, 'error').mockImplementation(() => {});

const mockGetPinnedChatMessage = jest.spyOn(
  twitchService,
  'getPinnedChatMessage',
);
const mockPinChatMessage = jest
  .spyOn(twitchService, 'pinChatMessage')
  .mockResolvedValue(undefined);
const mockToastError = jest.mocked(toast.error);
const mockToastSuccess = jest.mocked(toast.success);
const mockUnpinChatMessage = jest
  .spyOn(twitchService, 'unpinChatMessage')
  .mockResolvedValue(undefined);
const mockUpdatePinnedChatMessage = jest
  .spyOn(twitchService, 'updatePinnedChatMessage')
  .mockResolvedValue(undefined);

const apiPinnedMessage: TwitchPinnedChatMessage = {
  broadcaster_name: 'Foam',
  expires_at: '2026-06-08T13:00:00.000Z',
  message: {
    text: 'api pinned text',
  },
  message_id: 'api-pin-1',
  moderator_name: 'ModUser',
  pinned_by_name: 'PinningMod',
  updated_at: '2026-06-08T12:00:00.000Z',
};

function renderPinnedMessage({
  canModerateChat = true,
  moderatorId = 'moderator-1',
}: {
  canModerateChat?: boolean;
  moderatorId?: string;
} = {}) {
  return renderHook(() =>
    usePinnedChatMessage({
      canModerateChat,
      channelId: 'channel-1',
      moderatorId,
    }),
  );
}

describe('usePinnedChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPinnedChatMessage.mockResolvedValue(apiPinnedMessage);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('loads the current pinned message when moderation access is available', async () => {
    const { result } = renderPinnedMessage();

    await waitFor(() => {
      expect(result.current.pinnedMessage).toEqual<PinnedChatMessageViewModel>({
        expiresAt: '2026-06-08T13:00:00.000Z',
        messageId: 'api-pin-1',
        pinnedByName: 'PinningMod',
        senderName: 'Foam',
        text: 'api pinned text',
        updatedAt: '2026-06-08T12:00:00.000Z',
      });
    });
    expect(mockGetPinnedChatMessage.mock.calls[0]?.[0]).toEqual({
      broadcasterId: 'channel-1',
      moderatorId: 'moderator-1',
    });
  });

  test('does not load pinned state without moderation access', async () => {
    const { result } = renderPinnedMessage({ canModerateChat: false });

    await waitFor(() => {
      expect(result.current.pinnedMessage).toBe(null);
    });
    expect(mockGetPinnedChatMessage).not.toHaveBeenCalled();
  });

  test('pins a selected chat message and then refreshes from Twitch', async () => {
    const selectedMessage = createChatMessage({
      text: 'pin this Kappa',
      tags: {
        id: 'message-to-pin',
        login: 'viewer',
        'display-name': 'Viewer',
        'user-id': 'viewer-1',
      },
    });
    const { result } = renderPinnedMessage();

    await act(async () => {
      result.current.handlePinMessage(createMessageActionData(selectedMessage));
    });

    await waitFor(() => {
      expect(mockPinChatMessage).toHaveBeenCalledTimes(1);
      expect(result.current.pinnedMessageBusy).toBe(false);
    });
    expect(mockPinChatMessage.mock.calls[0]?.[0]).toEqual({
      broadcasterId: 'channel-1',
      messageId: 'message-to-pin',
      moderatorId: 'moderator-1',
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Message pinned');
    expect(result.current.pinnedMessage).toEqual<PinnedChatMessageViewModel>({
      expiresAt: '2026-06-08T13:00:00.000Z',
      messageId: 'api-pin-1',
      pinnedByName: 'PinningMod',
      senderName: 'Foam',
      text: 'api pinned text',
      updatedAt: '2026-06-08T12:00:00.000Z',
    });
  });

  test('refreshes and unpins the current pinned message', async () => {
    const { result } = renderPinnedMessage();

    await waitFor(() => {
      expect(result.current.pinnedMessageId).toBe('api-pin-1');
    });

    await act(async () => {
      result.current.handleRefreshPinnedMessage();
    });

    await waitFor(() => {
      expect(mockUpdatePinnedChatMessage).toHaveBeenCalledWith({
        broadcasterId: 'channel-1',
        messageId: 'api-pin-1',
        moderatorId: 'moderator-1',
      });
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Pin refreshed');

    await act(async () => {
      result.current.handleUnpinPinnedMessage();
    });

    await waitFor(() => {
      expect(result.current.pinnedMessage).toBe(null);
    });
    expect(mockUnpinChatMessage.mock.calls[0]?.[0]).toEqual({
      broadcasterId: 'channel-1',
      moderatorId: 'moderator-1',
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Message unpinned');
  });

  test('silently refreshes a pinned message on the refresh interval and suppresses duplicate silent refreshes', async () => {
    jest.useFakeTimers();
    let resolveRefresh: () => void = () => {};
    mockUpdatePinnedChatMessage.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveRefresh = resolve;
        }),
    );
    const { result } = renderPinnedMessage();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.pinnedMessageId).toBe('api-pin-1');

    act(() => {
      jest.advanceTimersByTime(60_000);
      jest.advanceTimersByTime(60_000);
    });

    expect(mockUpdatePinnedChatMessage.mock.calls).toEqual([
      [
        {
          broadcasterId: 'channel-1',
          messageId: 'api-pin-1',
          moderatorId: 'moderator-1',
        },
      ],
    ]);
    expect(mockToastSuccess).not.toHaveBeenCalledWith('Pin refreshed');

    await act(async () => {
      resolveRefresh();
    });
  });

  test('shows an error toast when pinning fails', async () => {
    mockPinChatMessage.mockRejectedValueOnce(new Error('pin failed'));
    const { result } = renderPinnedMessage();

    await act(async () => {
      result.current.handlePinMessage(
        createMessageActionData(
          createChatMessage({
            tags: {
              id: 'failed-pin',
            },
          }),
        ),
      );
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Could not pin message');
      expect(result.current.pinnedMessageBusy).toBe(false);
    });
  });
});
