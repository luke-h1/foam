import {
  getAnalytics,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

import { logger } from '@app/utils/logger';

import { logAnalyticsScreenView, setAnalyticsEnabled } from './analytics';

const mockedSetCollectionEnabled = jest.mocked(setAnalyticsCollectionEnabled);
const mockedLogScreenView = jest.mocked(logScreenView);

const analyticsInstance = jest.mocked(getAnalytics).mock.results[0]?.value;

jest.spyOn(logger.main, 'warn').mockImplementation(() => {});

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setAnalyticsEnabled toggles collection', async () => {
    await setAnalyticsEnabled(false);

    expect(mockedSetCollectionEnabled.mock.calls).toEqual([
      [analyticsInstance, false],
    ]);

    expect(mockedSetCollectionEnabled.mock.calls[0]?.[0]).toBe(
      analyticsInstance,
    );
  });

  test('logAnalyticsScreenView reports screen name and class', async () => {
    await logAnalyticsScreenView('/streams/foam');

    expect(mockedLogScreenView.mock.calls).toEqual([
      [
        analyticsInstance,
        { screen_name: '/streams/foam', screen_class: '/streams/foam' },
      ],
    ]);

    expect(mockedLogScreenView.mock.calls[0]?.[0]).toBe(analyticsInstance);
  });

  test('swallows SDK failures instead of throwing', async () => {
    mockedLogScreenView.mockRejectedValueOnce(new Error('offline'));

    await expect(
      logAnalyticsScreenView('/streams/foam'),
    ).resolves.toBeUndefined();
  });
});
