import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { storageMMKV as _storageMMKV } from '@app/lib/mmkv';
import { OnboardingScreen } from '../OnboardingScreen';

jest.mock('@app/lib/mmkv', () => ({
  storageMMKV: { set: jest.fn() },
}));

jest.mock('@app/components/EnergyOrb/EnergyOrb', () => ({
  EnergyOrb: () => null,
}));

const makeAnimation = () => {
  const anim: Record<string, unknown> = {};
  ['duration', 'delay', 'easing', 'springify', 'damping', 'stiffness'].forEach(
    m => {
      anim[m] = () => anim;
    },
  );
  return anim;
};

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const animatedComponent = React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode },
      ref: React.Ref<unknown>,
    ) => React.createElement(View, { ...props, ref }, children),
  );
  const identityAnimation = (
    value: unknown,
    _config?: unknown,
    callback?: (finished?: boolean) => void,
  ) => {
    callback?.(true);
    return value;
  };
  return {
    __esModule: true,
    default: {
      View: animatedComponent,
      Text: animatedComponent,
      Image: animatedComponent,
      ScrollView: animatedComponent,
      FlatList: animatedComponent,
      createAnimatedComponent: (c: unknown) => c,
    },
    FadeInUp: makeAnimation(),
    FadeInDown: makeAnimation(),
    Easing: { bezier: jest.fn(() => jest.fn()), linear: jest.fn() },
    useSharedValue: (v: unknown) => {
      const sv = {
        value: v,
        get: () => sv.value,
        set: (x: unknown) => {
          sv.value = x;
        },
      };
      return sv;
    },
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: identityAnimation,
    withSpring: identityAnimation,
    withDelay: (_d: number, v: unknown) => v,
    runOnJS: (fn: (...a: unknown[]) => unknown) => fn,
    createAnimatedComponent: (c: unknown) => c,
  };
});

const storageMMKV = jest.mocked(_storageMMKV);
const mockReplace = jest.mocked(router.replace);

describe('OnboardingScreen', () => {
  test('renders welcome heading and description', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Welcome to foam')).toBeTruthy();
    expect(screen.getByText(/The fastest way to watch Twitch/)).toBeTruthy();
  });

  test('navigates to root and persists seen state when Get started is pressed', () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText('Get started'));

    expect(storageMMKV.set).toHaveBeenCalledWith('V1_hasSeenOnboarding', true);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  test('shows skip button', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Skip')).toBeTruthy();
  });
});
