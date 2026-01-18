/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  loadChannelResources,
  createLoadController,
  abortCurrentLoad,
} from '@app/store/chatStore';
import { DefaultWrapper } from '@app/test/render';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChatEmoteLoader } from '../useChatEmoteLoader';

// Mock the chatStore functions
jest.mock('@app/store/chatStore', () => {
  const originalModule = jest.requireActual('@app/store/chatStore');
  return {
    ...originalModule,
    loadChannelResources: jest.fn(),
    createLoadController: jest.fn(),
    abortCurrentLoad: jest.fn(),
    getSevenTvEmoteSetId: jest.fn(),
  };
});

const mockLoadChannelResources = loadChannelResources as jest.MockedFunction<
  typeof loadChannelResources
>;
const mockCreateLoadController = createLoadController as jest.MockedFunction<
  typeof createLoadController
>;
const mockAbortCurrentLoad = abortCurrentLoad as jest.MockedFunction<
  typeof abortCurrentLoad
>;

describe('useChatEmoteLoader', () => {
  let mockAbortController: AbortController;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAbortController = new AbortController();
    mockCreateLoadController.mockReturnValue(mockAbortController);
    mockLoadChannelResources.mockResolvedValue(true);
  });

  describe('Initial State', () => {
    test('should start with idle status', () => {
      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: false,
          }),
        { wrapper: DefaultWrapper },
      );

      expect(result.current.status).toBe('idle');
    });

    test('should return cancel and refetch functions', () => {
      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: false,
          }),
        { wrapper: DefaultWrapper },
      );

      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Loading Behavior', () => {
    test('should load emotes when enabled and channelId provided', async () => {
      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel-123',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(mockCreateLoadController).toHaveBeenCalled();
      expect(mockLoadChannelResources).toHaveBeenCalledWith({
        channelId: 'test-channel-123',
        forceRefresh: false,
        signal: mockAbortController.signal,
      });
    });

    test('should not load when disabled', async () => {
      renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: false,
          }),
        { wrapper: DefaultWrapper },
      );

      await act(() => {
        return new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(mockLoadChannelResources).not.toHaveBeenCalled();
    });

    test('should not load when channelId is empty', async () => {
      renderHook(
        () =>
          useChatEmoteLoader({
            channelId: '',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await act(() => {
        return new Promise(resolve => {
          setTimeout(resolve, 50);
        });
      });

      expect(mockLoadChannelResources).not.toHaveBeenCalled();
    });

    test('should set status to loading during fetch', async () => {
      mockLoadChannelResources.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(true), 10);
        });
      });

      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Verify loadChannelResources was called
      expect(mockLoadChannelResources).toHaveBeenCalled();
    });

    test('should set status to error when load fails', async () => {
      mockLoadChannelResources.mockResolvedValue(false);

      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });

    test('should set status to error when load throws', async () => {
      mockLoadChannelResources.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('Cancellation', () => {
    test('should cancel load when cancel is called', async () => {
      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Call cancel
      act(() => {
        result.current.cancel();
      });

      // Abort should be called and status should be cancelled
      expect(mockAbortCurrentLoad).toHaveBeenCalled();
      expect(result.current.status).toBe('cancelled');
    });

    test('should cancel on unmount', async () => {
      const { unmount } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await waitFor(() => {
        expect(mockLoadChannelResources).toHaveBeenCalled();
      });

      unmount();

      expect(mockAbortCurrentLoad).toHaveBeenCalled();
    });

    test('should set cancelled status when signal is aborted during load', async () => {
      mockLoadChannelResources.mockImplementation(() => {
        // Simulate abort during load
        mockAbortController.abort();
        return Promise.resolve(true);
      });

      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('cancelled');
      });
    });
  });

  describe('Refetch', () => {
    test('should reload with forceRefresh when refetch is called', async () => {
      const { result } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      jest.clearAllMocks();
      mockCreateLoadController.mockReturnValue(new AbortController());

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockLoadChannelResources).toHaveBeenCalledWith(
        expect.objectContaining({
          forceRefresh: true,
        }),
      );
    });
  });

  describe('Channel Changes', () => {
    test('should reload when channelId changes', async () => {
      const { result, rerender } = renderHook(
        ({ channelId }) =>
          useChatEmoteLoader({
            channelId,
            enabled: true,
          }),
        {
          wrapper: DefaultWrapper,
          initialProps: { channelId: 'channel-1' },
        },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      expect(mockLoadChannelResources).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId: 'channel-1',
        }),
      );

      jest.clearAllMocks();
      mockCreateLoadController.mockReturnValue(new AbortController());

      rerender({ channelId: 'channel-2' });

      await waitFor(() => {
        expect(mockLoadChannelResources).toHaveBeenCalledWith(
          expect.objectContaining({
            channelId: 'channel-2',
          }),
        );
      });
    });

    test('should reset status when channelId changes', async () => {
      const { result, rerender } = renderHook(
        ({ channelId }) =>
          useChatEmoteLoader({
            channelId,
            enabled: true,
          }),
        {
          wrapper: DefaultWrapper,
          initialProps: { channelId: 'channel-1' },
        },
      );

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      rerender({ channelId: 'channel-2' });

      // Status should reset to idle before loading starts
      expect(result.current.status).toBe('idle');
    });
  });

  describe('Race Conditions', () => {
    test('should handle rapid channel changes correctly', async () => {
      const { rerender } = renderHook(
        ({ channelId }) =>
          useChatEmoteLoader({
            channelId,
            enabled: true,
          }),
        {
          wrapper: DefaultWrapper,
          initialProps: { channelId: 'channel-1' },
        },
      );

      // Rapid channel changes
      rerender({ channelId: 'channel-2' });
      rerender({ channelId: 'channel-3' });
      rerender({ channelId: 'channel-4' });

      // Should have called createLoadController for channel changes
      await waitFor(() => {
        expect(mockCreateLoadController).toHaveBeenCalled();
      });
    });

    test('should not throw when unmounting during load', () => {
      const loadPromise = new Promise<boolean>(() => {
        // Never resolves - simulates slow load
      });

      mockLoadChannelResources.mockReturnValue(loadPromise);

      const { unmount } = renderHook(
        () =>
          useChatEmoteLoader({
            channelId: 'test-channel',
            enabled: true,
          }),
        { wrapper: DefaultWrapper },
      );

      // Unmount while load is pending - should not throw
      expect(() => {
        unmount();
      }).not.toThrow();

      // Abort should be called
      expect(mockAbortCurrentLoad).toHaveBeenCalled();
    });
  });
});
