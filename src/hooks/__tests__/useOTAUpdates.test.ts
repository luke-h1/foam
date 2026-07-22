import { renderHook } from '@testing-library/react-native';
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  type UpdateCheckResultAvailable,
  type UpdateFetchResultFailure,
} from 'expo-updates';

import { countOtaMetric } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

import { useOTAUpdates } from '../useOTAUpdates';

jest.mock('expo-updates', () => ({
  __esModule: true,
  isEnabled: true,
  channel: 'internal',
  latestContext: { isUpdatePending: false },
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  setExtraParamAsync: jest.fn().mockResolvedValue(undefined),
  reloadAsync: jest.fn(),
  addUpdatesStateChangeListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-application', () => ({
  nativeBuildVersion: '123',
}));

jest.mock('@app/lib/sentry', () => ({
  countOtaMetric: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    main: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

jest.mock('@app/utils/appState/appStateTransitions', () => ({
  subscribeToAppStateTransitions: jest.fn(() => jest.fn()),
  isForegroundTransition: jest.fn(() => false),
}));

const mockedCheck = jest.mocked(checkForUpdateAsync);
const mockedFetch = jest.mocked(fetchUpdateAsync);
const mockedCountOtaMetric = jest.mocked(countOtaMetric);
const mockedError = jest.mocked(logger.main.error);
const mockedWarn = jest.mocked(logger.main.warn);

const globalWithDev = global as typeof global & { __DEV__: boolean };
const originalDev = globalWithDev.__DEV__;

const fetchSuccess: UpdateFetchResultFailure = {
  isNew: false,
  manifest: undefined,
  isRollBackToEmbedded: false,
};

describe('useOTAUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // shouldReceiveUpdates gates on `!__DEV__`; enable the update path.
    globalWithDev.__DEV__ = false;
    mockedCheck.mockResolvedValue({
      isAvailable: true,
      isRollBackToEmbedded: false,
      reason: undefined,
      manifest: { id: 'abc' },
    } as UpdateCheckResultAvailable);
  });

  afterEach(() => {
    jest.useRealTimers();
    globalWithDev.__DEV__ = originalDev;
  });

  test('retries a transient fetch failure and self-heals without logging an error', async () => {
    mockedFetch
      .mockRejectedValueOnce(new Error('ERR_UPDATES_FETCH: undefined reason'))
      .mockResolvedValueOnce(fetchSuccess);

    renderHook(() => useOTAUpdates());

    // initial check (3s) → attempt 1 fetch rejects → backoff (4s) → attempt 2 succeeds
    await jest.advanceTimersByTimeAsync(3e3);
    await jest.advanceTimersByTimeAsync(4e3);

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedError).not.toHaveBeenCalled();
    expect(mockedWarn).toHaveBeenCalledTimes(1);
    expect(mockedCountOtaMetric).toHaveBeenCalledWith('ota.check.retry', {
      attempt: 1,
      channel: 'internal',
      environment: 'non-production',
      platform: 'ios',
    });
    expect(mockedCountOtaMetric).toHaveBeenCalledWith('ota.update.fetched', {
      channel: 'internal',
      environment: 'non-production',
      platform: 'ios',
    });
  });

  test('logs a single error and a failed metric after exhausting retries', async () => {
    mockedFetch.mockRejectedValue(
      new Error('ERR_UPDATES_FETCH: undefined reason'),
    );

    renderHook(() => useOTAUpdates());

    await jest.advanceTimersByTimeAsync(3e3);
    await jest.advanceTimersByTimeAsync(4e3);
    await jest.advanceTimersByTimeAsync(8e3);

    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(mockedError).toHaveBeenCalledTimes(1);
    expect(mockedCountOtaMetric).toHaveBeenCalledWith('ota.check.failed', {
      channel: 'internal',
      environment: 'non-production',
      platform: 'ios',
    });
  });
});
