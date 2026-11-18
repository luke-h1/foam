import { Text } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';
import { usePathname } from 'expo-router';

import * as analyticsModule from '@app/hooks/firebase/analytics';
import { AnalyticsProvider } from '@app/providers/AnalyticsProvider';
import { getPreferences, preferences$ } from '@app/store/preference-store';

const mockedUsePathname = jest.mocked(usePathname);

const mockedSetAnalyticsEnabled = jest
  .spyOn(analyticsModule, 'setAnalyticsEnabled')
  .mockResolvedValue(undefined);

const mockedLogScreenView = jest
  .spyOn(analyticsModule, 'logAnalyticsScreenView')
  .mockResolvedValue(undefined);

describe('AnalyticsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePathname.mockReturnValue('/streams/live-stream/foam');
    mockedSetAnalyticsEnabled.mockResolvedValue(undefined);
    mockedLogScreenView.mockResolvedValue(undefined);
    preferences$.set({ ...getPreferences(), analyticsEnabled: true });
  });

  test('logs the initial screen view only after collection is enabled', async () => {
    let resolveEnable = () => {};

    mockedSetAnalyticsEnabled.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveEnable = resolve;
        }),
    );

    render(
      <AnalyticsProvider>
        <Text>child</Text>
      </AnalyticsProvider>,
    );

    await waitFor(() => {
      expect(mockedSetAnalyticsEnabled).toHaveBeenCalledWith(true);
    });

    expect(mockedLogScreenView).not.toHaveBeenCalled();

    await act(async () => {
      resolveEnable();
    });

    expect(mockedLogScreenView).toHaveBeenCalledWith(
      '/streams/live-stream/foam',
    );
  });

  test('disables collection and never logs when the preference is off', async () => {
    preferences$.set({ ...getPreferences(), analyticsEnabled: false });

    render(
      <AnalyticsProvider>
        <Text>child</Text>
      </AnalyticsProvider>,
    );

    await waitFor(() => {
      expect(mockedSetAnalyticsEnabled).toHaveBeenCalledWith(false);
    });

    await act(async () => {});
    expect(mockedLogScreenView).not.toHaveBeenCalled();
  });
});
