import {
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

import { logger } from '@app/utils/logger';

import { logAnalyticsScreenView, setAnalyticsEnabled } from './analytics';

const mockedSetCollectionEnabled = jest.mocked(setAnalyticsCollectionEnabled);
const mockedLogScreenView = jest.mocked(logScreenView);
const mockedWarn = jest.spyOn(logger.main, 'warn').mockImplementation();

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setAnalyticsEnabled toggles collection', async () => {
    await setAnalyticsEnabled(false);

    expect(mockedSetCollectionEnabled).toHaveBeenCalledWith(
      expect.anything(),
      false,
    );
  });

  test('logAnalyticsScreenView reports screen name and class', async () => {
    await logAnalyticsScreenView('/streams/foam');

    expect(mockedLogScreenView).toHaveBeenCalledWith(expect.anything(), {
      screen_name: '/streams/foam',
      screen_class: '/streams/foam',
    });
  });

  test('swallows and logs SDK failures instead of throwing', async () => {
    mockedLogScreenView.mockRejectedValueOnce(new Error('offline'));

    await expect(
      logAnalyticsScreenView('/streams/foam'),
    ).resolves.toBeUndefined();
    expect(mockedWarn).toHaveBeenCalledWith(
      'Failed to log analytics screen view',
      expect.any(Error),
    );
  });
});
