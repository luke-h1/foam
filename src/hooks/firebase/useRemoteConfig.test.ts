import { logger } from '@app/utils/logger';
import { renderHook, waitFor } from '@testing-library/react-native';
import { fetchAndActivate } from '@react-native-firebase/remote-config';
import { useRemoteConfig } from './useRemoteConfig';

jest.mock('@app/utils/logger', () => ({
  logger: {
    remoteConfig: {
      error: jest.fn(),
      info: jest.fn(),
    },
  },
}));

jest.mock('@react-native-firebase/installations');
jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/remote-config');

const mockedFetchAndActivate = jest.mocked(fetchAndActivate);
const remoteConfigLogger = logger.remoteConfig as unknown as {
  error: jest.Mock;
  info: jest.Mock;
};

describe('useRemoteConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('treats cancelled fetchAndActivate requests as non-errors', async () => {
    mockedFetchAndActivate.mockRejectedValueOnce(
      new Error('[remoteConfig/unknown] cancelled'),
    );

    const { result } = renderHook(() => useRemoteConfig());

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });

    expect(remoteConfigLogger.error).not.toHaveBeenCalledWith(
      'fetchAndActivate failed',
      expect.anything(),
    );
    expect(remoteConfigLogger.info.mock.calls[0]).toEqual([
      'fetchAndActivate cancelled',
      {
        error: '[remoteConfig/unknown] cancelled',
      },
    ]);
  });
});
