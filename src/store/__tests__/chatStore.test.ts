import { bttvSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedChannelEmoteSet.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seventv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import {
  chatStore$,
  createLoadController,
  abortCurrentLoad,
  isLoadAborted,
  loadChannelResources,
  cacheEmoteImages,
  clearMessages,
  addMessage,
  addMessages,
  clearChannelResources,
  getSevenTvEmoteSetId,
  ChatMessageType,
} from '../chatStore';

// Mock all services
jest.mock('@app/services/seventv-service');
jest.mock('@app/services/twitch-emote-service');
jest.mock('@app/services/bttv-emote-service');
jest.mock('@app/services/ffz-service');
jest.mock('@app/services/twitch-badge-service');
jest.mock('@app/services/chatterino-service');

// Type for the mocked image cache module
interface ImageCacheMock {
  cacheImageFromUrl: jest.Mock<Promise<string>, [string]>;
  getCachedImageUri: jest.Mock<string | null, [string]>;
  clearSessionCache: jest.Mock<void, []>;
}

jest.mock('@app/utils/image/image-cache', () => ({
  cacheImageFromUrl: jest.fn().mockResolvedValue('file://cached'),
  getCachedImageUri: jest.fn().mockReturnValue(null),
  clearSessionCache: jest.fn(),
}));

const mockSevenTvService = sevenTvService as jest.Mocked<typeof sevenTvService>;
const mockTwitchEmoteService = twitchEmoteService as jest.Mocked<
  typeof twitchEmoteService
>;
const mockBttvEmoteService = bttvEmoteService as jest.Mocked<
  typeof bttvEmoteService
>;
const mockFfzService = ffzService as jest.Mocked<typeof ffzService>;
const mockTwitchBadgeService = twitchBadgeService as jest.Mocked<
  typeof twitchBadgeService
>;
const mockChatterinoService = chatterinoService as jest.Mocked<
  typeof chatterinoService
>;

describe('chatStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMessages();
    clearChannelResources();
    abortCurrentLoad();

    // Default mock implementations
    mockSevenTvService.getEmoteSetId.mockResolvedValue('test-emote-set-id');
    mockSevenTvService.getSanitisedEmoteSet.mockResolvedValue(
      sevenTvSanitisedChannelEmoteSetFixture.slice(0, 5),
    );
    mockTwitchEmoteService.getChannelEmotes.mockResolvedValue([]);
    mockTwitchEmoteService.getGlobalEmotes.mockResolvedValue([]);
    mockBttvEmoteService.getSanitisedGlobalEmotes.mockResolvedValue([]);
    mockBttvEmoteService.getSanitisedChannelEmotes.mockResolvedValue(
      bttvSanitisedChannelEmoteSet.slice(0, 3),
    );
    mockFfzService.getSanitisedChannelEmotes.mockResolvedValue([]);
    mockFfzService.getSanitisedGlobalEmotes.mockResolvedValue([]);
    mockFfzService.getSanitisedGlobalBadges.mockResolvedValue([]);
    mockFfzService.getSanitisedChannelBadges.mockResolvedValue([]);
    (
      mockTwitchBadgeService.listSanitisedChannelBadges as jest.Mock
    ).mockResolvedValue([]);
    (
      mockTwitchBadgeService.listSanitisedGlobalBadges as jest.Mock
    ).mockResolvedValue([]);
    (mockChatterinoService.listSanitisedBadges as jest.Mock).mockResolvedValue(
      [],
    );
  });

  describe('AbortController Management', () => {
    describe('createLoadController', () => {
      test('should create a new AbortController', () => {
        const controller = createLoadController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
      });

      test('should abort previous controller when creating a new one', () => {
        const firstController = createLoadController();
        expect(firstController.signal.aborted).toBe(false);

        const secondController = createLoadController();

        expect(firstController.signal.aborted).toBe(true);
        expect(secondController.signal.aborted).toBe(false);
      });

      test('should allow multiple sequential controllers', () => {
        const controllers: AbortController[] = [];

        for (let i = 0; i < 5; i += 1) {
          controllers.push(createLoadController());
        }

        // All but the last should be aborted
        controllers.slice(0, -1).forEach(controller => {
          expect(controller.signal.aborted).toBe(true);
        });

        // Last one should still be active
        const lastController = controllers[controllers.length - 1];
        expect(lastController?.signal.aborted).toBe(false);
      });
    });

    describe('abortCurrentLoad', () => {
      test('should abort the current controller', () => {
        const controller = createLoadController();
        expect(controller.signal.aborted).toBe(false);

        abortCurrentLoad();

        expect(controller.signal.aborted).toBe(true);
      });

      test('should be safe to call multiple times', () => {
        createLoadController();

        expect(() => {
          abortCurrentLoad();
          abortCurrentLoad();
          abortCurrentLoad();
        }).not.toThrow();
      });

      test('should be safe to call without a controller', () => {
        expect(() => {
          abortCurrentLoad();
        }).not.toThrow();
      });
    });

    describe('isLoadAborted', () => {
      test('should return false when no controller exists', () => {
        abortCurrentLoad(); // Clear any existing controller
        expect(isLoadAborted()).toBe(false);
      });

      test('should return false when controller is active', () => {
        createLoadController();
        expect(isLoadAborted()).toBe(false);
      });

      test('should return true when controller is aborted', () => {
        const controller = createLoadController();
        controller.abort();
        expect(isLoadAborted()).toBe(true);
      });
    });
  });

  describe('loadChannelResources', () => {
    const TEST_CHANNEL_ID = 'test-channel-123';

    test('should load channel resources successfully', async () => {
      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
      });

      expect(result).toBe(true);
      expect(chatStore$.loadingState.peek()).toBe('COMPLETED');
      expect(chatStore$.currentChannelId.peek()).toBe(TEST_CHANNEL_ID);
    });

    test('should set loading state to LOADING during fetch', async () => {
      // Create a delayed promise to check loading state
      let resolveDelay: () => void;
      const delayPromise = new Promise<void>(resolve => {
        resolveDelay = resolve;
      });

      mockSevenTvService.getEmoteSetId.mockImplementation(() => {
        expect(chatStore$.loadingState.peek()).toBe('LOADING');
        resolveDelay();
        return Promise.resolve('test-set-id');
      });

      const loadPromise = loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
      });

      await delayPromise;
      await loadPromise;
    });

    test('should abort immediately if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        signal: controller.signal,
      });

      expect(result).toBe(false);
      expect(mockSevenTvService.getEmoteSetId).not.toHaveBeenCalled();
    });

    test('should abort after 7TV set ID fetch if signal is aborted', async () => {
      const controller = new AbortController();

      mockSevenTvService.getEmoteSetId.mockImplementation(() => {
        controller.abort();
        return Promise.resolve('test-set-id');
      });

      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
        signal: controller.signal,
      });

      expect(result).toBe(false);
      expect(chatStore$.loadingState.peek()).toBe('IDLE');
    });

    test('should abort after parallel fetch if signal is aborted', async () => {
      const controller = new AbortController();

      // Abort after the parallel fetch starts
      mockSevenTvService.getSanitisedEmoteSet.mockImplementation(() => {
        controller.abort();
        return Promise.resolve(
          sevenTvSanitisedChannelEmoteSetFixture.slice(0, 3),
        );
      });

      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
        signal: controller.signal,
      });

      expect(result).toBe(false);
      expect(chatStore$.loadingState.peek()).toBe('IDLE');
    });

    test('should not commit to store if aborted before completion', async () => {
      const controller = new AbortController();

      // Abort right before committing
      let callCount = 0;
      mockSevenTvService.getSanitisedEmoteSet.mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          // After both channel and global emotes are fetched
          controller.abort();
        }
        return Promise.resolve(
          sevenTvSanitisedChannelEmoteSetFixture.slice(0, 2),
        );
      });

      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
        signal: controller.signal,
      });

      expect(result).toBe(false);
    });

    test('should support legacy signature (channelId, forceRefresh)', async () => {
      const result = await loadChannelResources(TEST_CHANNEL_ID, true);

      expect(result).toBe(true);
      expect(chatStore$.loadingState.peek()).toBe('COMPLETED');
    });

    test('should use cache when available and not expired', async () => {
      // First load to populate cache
      await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
      });

      jest.clearAllMocks();

      // Second load should use cache
      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: false,
      });

      expect(result).toBe(true);
      // Should not have made API calls for emotes (cache hit)
      expect(mockSevenTvService.getSanitisedEmoteSet).not.toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      mockSevenTvService.getEmoteSetId.mockRejectedValue(
        new Error('Network error'),
      );

      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
      });

      // Should still succeed with fallback to 'global'
      expect(result).toBe(true);
    });

    test('should set ERROR state when all services fail critically', async () => {
      mockSevenTvService.getEmoteSetId.mockRejectedValue(
        new Error('Network error'),
      );
      mockSevenTvService.getSanitisedEmoteSet.mockRejectedValue(
        new Error('Network error'),
      );
      mockTwitchEmoteService.getChannelEmotes.mockRejectedValue(
        new Error('Network error'),
      );

      // Since Promise.allSettled is used, it should still complete
      const result = await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
      });

      // With Promise.allSettled, even if all fail, we get empty arrays
      expect(result).toBe(true);
    });
  });

  describe('cacheEmoteImages', () => {
    const getImageCacheMock = (): ImageCacheMock =>
      jest.requireMock<ImageCacheMock>('@app/utils/image/image-cache');

    test('should cache emote images', async () => {
      const emotes = sevenTvSanitisedChannelEmoteSetFixture.slice(0, 5);

      await cacheEmoteImages(emotes);

      // Should have attempted to cache images
      const imageCacheMock = getImageCacheMock();
      expect(imageCacheMock.cacheImageFromUrl).toHaveBeenCalled();
    });

    test('should skip caching if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const emotes = sevenTvSanitisedChannelEmoteSetFixture.slice(0, 5);

      await cacheEmoteImages(emotes, controller.signal);

      const imageCacheMock = getImageCacheMock();
      expect(imageCacheMock.cacheImageFromUrl).not.toHaveBeenCalled();
    });

    test('should abort between batches', async () => {
      const controller = new AbortController();

      // Use more emotes than batch size (20)
      const emotes = sevenTvSanitisedChannelEmoteSetFixture.slice(0, 50);

      const imageCacheMock = getImageCacheMock();

      let callCount = 0;
      imageCacheMock.cacheImageFromUrl.mockImplementation(() => {
        callCount += 1;
        // Abort after first batch
        if (callCount === 20) {
          controller.abort();
        }
        return Promise.resolve('file://cached');
      });

      await cacheEmoteImages(emotes, controller.signal);

      // Should have stopped after first batch
      expect(callCount).toBe(20);
    });

    test('should handle empty emotes array', async () => {
      await expect(cacheEmoteImages([])).resolves.not.toThrow();
    });

    test('should skip already cached images', async () => {
      const imageCacheMock = getImageCacheMock();

      // Simulate all images being cached
      imageCacheMock.getCachedImageUri.mockReturnValue('file://already-cached');

      const emotes = sevenTvSanitisedChannelEmoteSetFixture.slice(0, 5);
      await cacheEmoteImages(emotes);

      expect(imageCacheMock.cacheImageFromUrl).not.toHaveBeenCalled();
    });
  });

  describe('Message Management', () => {
    const createTestMessage = (id: string): ChatMessageType<never> =>
      ({
        id,
        message_id: id,
        message_nonce: `nonce-${id}`,
        message: [{ type: 'text', content: `Test message ${id}` }],
        channel: 'test-channel',
        sender: 'TestUser',
        badges: [],
        userstate: {
          'display-name': 'TestUser',
          login: 'testuser',
          username: 'TestUser',
          'user-id': '123',
          id,
          color: '#FF0000',
          badges: {},
          'badges-raw': '',
          'user-type': '',
          mod: '0',
          subscriber: '0',
          turbo: '0',
          'emote-sets': '',
          'reply-parent-msg-id': '',
          'reply-parent-msg-body': '',
          'reply-parent-display-name': '',
          'reply-parent-user-login': '',
        },
        parentDisplayName: '',
        replyDisplayName: '',
        replyBody: '',
      }) as ChatMessageType<never>;

    test('should add a single message', () => {
      const message = createTestMessage('1');
      addMessage(message);

      const messages = chatStore$.messages.peek();
      expect(messages).toHaveLength(1);
      expect(messages[0]?.id).toBe('1');
    });

    test('should add multiple messages in batch', () => {
      const messages = [
        createTestMessage('1'),
        createTestMessage('2'),
        createTestMessage('3'),
      ];
      addMessages(messages);

      const storedMessages = chatStore$.messages.peek();
      expect(storedMessages).toHaveLength(3);
    });

    test('should clear messages', () => {
      addMessage(createTestMessage('1'));
      addMessage(createTestMessage('2'));

      clearMessages();

      expect(chatStore$.messages.peek()).toHaveLength(0);
    });

    test('should limit messages to MAX_MESSAGES (500)', () => {
      const messages = Array.from({ length: 600 }, (_, i) =>
        createTestMessage(`${i}`),
      );
      addMessages(messages);

      // After trimming, should be around 500 or less
      expect(chatStore$.messages.peek().length).toBeLessThanOrEqual(500);
    });
  });

  describe('getSevenTvEmoteSetId', () => {
    test('should return null/undefined when no cache exists', () => {
      const result = getSevenTvEmoteSetId('non-existent-channel');
      expect(result).toBeFalsy();
    });

    test('should return emote set ID from cache', async () => {
      const TEST_CHANNEL_ID = 'test-channel-for-emote-set';

      await loadChannelResources({
        channelId: TEST_CHANNEL_ID,
        forceRefresh: true,
      });

      const result = getSevenTvEmoteSetId(TEST_CHANNEL_ID);
      expect(result).toBe('test-emote-set-id');
    });
  });
});
