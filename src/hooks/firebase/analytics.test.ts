import {
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

import { logger } from '@app/utils/logger';

import {
  logAnalyticsEvent,
  logAnalyticsScreenView,
  setAnalyticsEnabled,
} from './analytics';

const mockedSetCollectionEnabled = jest.mocked(setAnalyticsCollectionEnabled);
const mockedLogEvent = jest.mocked(logEvent);
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

  test('logAnalyticsEvent forwards name and params', async () => {
    await logAnalyticsEvent('experiment_exposure', {
      experiment: 'chatComposerLayout',
      variant: 'compact',
    });

    expect(mockedLogEvent).toHaveBeenCalledWith(
      expect.anything(),
      'experiment_exposure',
      { experiment: 'chatComposerLayout', variant: 'compact' },
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
    mockedLogEvent.mockRejectedValueOnce(new Error('offline'));

    await expect(
      logAnalyticsEvent('experiment_exposure', {
        experiment: 'chatComposerLayout',
        variant: 'control',
      }),
    ).resolves.toBeUndefined();
    expect(mockedWarn).toHaveBeenCalledWith(
      'Failed to log analytics event',
      expect.any(Error),
    );
  });
});
