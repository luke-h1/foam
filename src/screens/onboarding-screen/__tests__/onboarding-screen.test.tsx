import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { storage } from '@app/lib/storage';
import render from '@app/test/render';

import { OnboardingScreen } from '../onboarding-screen';

const mockReplace = jest.mocked(router.replace);

describe('OnboardingScreen', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  test('navigates to root and persists seen state when Get started is pressed', () => {
    render(<OnboardingScreen />);

    expect(storage.getBoolean('V1_hasSeenOnboarding')).toBe(undefined);

    fireEvent.press(screen.getByText('Get started'));

    expect(storage.getBoolean('V1_hasSeenOnboarding')).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
