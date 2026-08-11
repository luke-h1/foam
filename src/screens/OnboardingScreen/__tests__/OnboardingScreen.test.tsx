import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  fireEvent,
  render as baseRender,
  screen,
} from '@testing-library/react-native';
import { router } from 'expo-router';

import { storage as _storage } from '@app/lib/storage';

import { OnboardingScreen } from '../OnboardingScreen';

jest.mock('@app/lib/storage', () => ({
  storage: { set: jest.fn() },
}));

const storage = jest.mocked(_storage);
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

    expect(storage.set).toHaveBeenCalledWith('V1_hasSeenOnboarding', true);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  test('shows skip button', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Skip')).toBeOnTheScreen();
  });
});
