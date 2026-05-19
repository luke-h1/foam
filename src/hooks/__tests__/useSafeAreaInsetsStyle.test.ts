import { renderHook } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeAreaInsetsStyle } from '../useSafeAreaInsetsStyle';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

const useSafeAreaInsetsMock = jest.mocked(useSafeAreaInsets);

describe('useSafeAreaInsetsStyle', () => {
  beforeEach(() => {
    useSafeAreaInsetsMock.mockReturnValue({
      bottom: 4,
      left: 8,
      right: 16,
      top: 32,
    });
  });

  test('maps physical and logical edges to padding styles', () => {
    const { result } = renderHook(() =>
      useSafeAreaInsetsStyle(['top', 'bottom', 'start', 'end']),
    );

    expect(result.current).toEqual({
      paddingTop: 32,
      paddingBottom: 4,
      paddingStart: 8,
      paddingEnd: 16,
    });
  });

  test('supports margin styles', () => {
    const { result } = renderHook(() =>
      useSafeAreaInsetsStyle(['left', 'right'], 'margin'),
    );

    expect(result.current).toEqual({
      marginStart: 8,
      marginEnd: 16,
    });
  });
});
