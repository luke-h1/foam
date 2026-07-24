import { Text } from 'react-native';

import { act, render, screen } from '@testing-library/react-native';

import {
  logAnalyticsScreenView,
  setAnalyticsEnabled,
} from '@app/hooks/firebase/analytics';

import { AnalyticsProvider } from '../AnalyticsProvider';

let mockPathname = '/streams/live-stream/foam';
let mockAnalyticsEnabled = true;

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('@app/hooks/firebase/analytics', () => ({
  logAnalyticsScreenView: jest.fn(() => Promise.resolve()),
  setAnalyticsEnabled: jest.fn(() => Promise.resolve()),
}));

jest.mock('@app/store/preferenceStore', () => ({
  usePreference: () => mockAnalyticsEnabled,
}));

const mockedSetAnalyticsEnabled = jest.mocked(setAnalyticsEnabled);
const mockedLogScreenView = jest.mocked(logAnalyticsScreenView);

describe('AnalyticsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/streams/live-stream/foam';
    mockAnalyticsEnabled = true;
  });

  test('renders children', async () => {
    render(
      <AnalyticsProvider>
        <Text>child</Text>
      </AnalyticsProvider>,
    );

    expect(screen.getByText('child')).toBeOnTheScreen();
    await act(async () => {});
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

    expect(mockedSetAnalyticsEnabled).toHaveBeenCalledWith(true);
    expect(mockedLogScreenView).not.toHaveBeenCalled();

    await act(async () => {
      resolveEnable();
    });

    expect(mockedLogScreenView).toHaveBeenCalledWith(
      '/streams/live-stream/foam',
    );
  });

  test('disables collection and never logs when the preference is off', async () => {
    mockAnalyticsEnabled = false;

    render(
      <AnalyticsProvider>
        <Text>child</Text>
      </AnalyticsProvider>,
    );

    await act(async () => {});

    expect(mockedSetAnalyticsEnabled).toHaveBeenCalledWith(false);
    expect(mockedLogScreenView).not.toHaveBeenCalled();
  });
});
