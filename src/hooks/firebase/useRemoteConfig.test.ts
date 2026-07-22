import { createElement, type PropsWithChildren } from 'react';

import { fetchAndActivate } from '@react-native-firebase/remote-config';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { DefaultWrapper } from '@app/test/render';
import { logger } from '@app/utils/logger';

import { useRemoteConfig } from './useRemoteConfig';

const wrapper = ({ children }: PropsWithChildren) =>
  createElement(DefaultWrapper, null, children);

jest.mock('@app/utils/logger', () => ({
  logger: {
    remoteConfig: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    },
  },
}));

jest.mock('@react-native-firebase/installations');
jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/remote-config');

const mockedFetchAndActivate = jest.mocked(fetchAndActivate);
const mockRemoteConfigError = jest.mocked(logger.remoteConfig.error);
const mockRemoteConfigWarn = jest.mocked(logger.remoteConfig.warn);
const mockRemoteConfigInfo = jest.mocked(logger.remoteConfig.info);

describe('useRemoteConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('treats cancelled fetchAndActivate requests as non-errors', async () => {
    mockedFetchAndActivate.mockRejectedValueOnce(
      new Error('[remoteConfig/unknown] cancelled'),
    );

    const { result } = renderHook(() => useRemoteConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });

    expect(mockRemoteConfigWarn).not.toHaveBeenCalled();
    expect(mockRemoteConfigError).not.toHaveBeenCalled();
    expect(mockRemoteConfigInfo.mock.calls[0]).toEqual([
      'fetchAndActivate cancelled',
      {
        error: '[remoteConfig/unknown] cancelled',
      },
    ]);
  });

  test('warns without erroring when fetchAndActivate fails to reach the server', async () => {
    const failure = new Error(
      '[remoteConfig/failure] fetch() operation cannot be completed successfully.',
    );
    mockedFetchAndActivate.mockRejectedValueOnce(failure);

    const { result } = renderHook(() => useRemoteConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });

    expect(mockRemoteConfigWarn.mock.calls[0]).toEqual([
      'fetchAndActivate failed; using cached or default config',
      failure,
    ]);
    expect(mockRemoteConfigError).not.toHaveBeenCalled();
  });
});
