import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  fireEvent,
  render as baseRender,
  screen,
} from '@testing-library/react-native';
import { router } from 'expo-router';

import { storageMMKV as _storageMMKV } from '@app/lib/mmkv';

import { OnboardingScreen } from '../OnboardingScreen';

jest.mock('@app/lib/mmkv', () => ({
  storageMMKV: { set: jest.fn() },
}));

const storageMMKV = jest.mocked(_storageMMKV);
const mockReplace = jest.mocked(router.replace);

const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

function render(ui: ReactElement) {
  return baseRender(ui, { wrapper });
}

describe('OnboardingScreen', () => {
  test('renders welcome heading and description', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Welcome to foam')).toBeOnTheScreen();
    expect(
      screen.getByText(/The fastest way to watch Twitch/),
    ).toBeOnTheScreen();
  });

  test('navigates to root and persists seen state when Get started is pressed', () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText('Get started'));

    expect(storageMMKV.set).toHaveBeenCalledWith('V1_hasSeenOnboarding', true);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  test('shows skip button', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Skip')).toBeOnTheScreen();
  });
});
