import { createElement, type PropsWithChildren } from 'react';

import { fetchAndActivate } from '@react-native-firebase/remote-config';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { DefaultWrapper } from '@app/test/render';
import { logger } from '@app/utils/logger';

import {
  isRemoteConfigCancellation,
  useRemoteConfig,
} from './use-remote-config';

const wrapper = ({ children }: PropsWithChildren) =>
  createElement(DefaultWrapper, null, children);

describe('isRemoteConfigCancellation', () => {
  test.each<[string, string | Error | { message: unknown } | null, boolean]>([
    ['a cancelled Error', new Error('[remoteConfig/unknown] cancelled'), true],
    ['a cancelled string', 'Request CANCELLED by the system', true],
    [
      'an object with a cancelled message',
      { message: 'fetch cancelled' },
      true,
    ],
    ['an Error for another failure', new Error('network timeout'), false],
    ['a string for another failure', 'throttled', false],
    ['an object with a non-string message', { message: 42 }, false],
    ['null', null, false],
  ])('classifies %s', (_name, cause, expected) => {
    expect(isRemoteConfigCancellation(cause)).toBe(expected);
  });
});

describe('useRemoteConfig', () => {
  test('does not report a cancelled fetchAndActivate as an error', async () => {
    const errorSpy = jest
      .spyOn(logger.remoteConfig, 'error')
      .mockImplementation(() => {});

    jest.spyOn(logger.remoteConfig, 'info').mockImplementation(() => {});

    jest
      .mocked(fetchAndActivate)
      .mockRejectedValueOnce(new Error('[remoteConfig/unknown] cancelled'));

    const { result } = renderHook(() => useRemoteConfig(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let refetched: boolean | undefined;

    await act(async () => {
      refetched = await result.current.refetch();
    });

    expect(refetched).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
