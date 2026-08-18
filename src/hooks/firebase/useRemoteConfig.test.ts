import { createElement, type PropsWithChildren } from 'react';

import { fetchAndActivate } from '@react-native-firebase/remote-config';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { DefaultWrapper } from '@app/test/render';
import { logger } from '@app/utils/logger';

import { useRemoteConfig } from './useRemoteConfig';

const wrapper = ({ children }: PropsWithChildren) =>
  createElement(DefaultWrapper, null, children);

const mockedFetchAndActivate = jest.mocked(fetchAndActivate);
const mockRemoteConfigError = jest
  .spyOn(logger.remoteConfig, 'error')
  .mockImplementation();
const mockRemoteConfigInfo = jest
  .spyOn(logger.remoteConfig, 'info')
  .mockImplementation();

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

    expect(mockRemoteConfigError).not.toHaveBeenCalledWith(
      'fetchAndActivate failed',
      expect.anything(),
    );
    expect(mockRemoteConfigInfo.mock.calls[0]).toEqual([
      'fetchAndActivate cancelled',
      {
        error: '[remoteConfig/unknown] cancelled',
      },
    ]);
  });
});
