import { act, renderHook } from '@testing-library/react-native';

import { useCountdownLabel } from '../use-countdown-label';

describe('useCountdownLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-05-09T10:00:00.000Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('counts down each second, then shows the elapsed label', () => {
    const { result } = renderHook(() =>
      useCountdownLabel('2026-05-09T10:01:02.000Z', 'Ending…'),
    );

    expect(result.current).toBe('1:02 left');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current).toBe('59s left');

    act(() => {
      jest.advanceTimersByTime(59_000);
    });

    expect(result.current).toBe('Ending…');
  });

  test('gives null and does not tick without an end time', () => {
    const { result } = renderHook(() =>
      useCountdownLabel(undefined, 'Ending…'),
    );

    expect(result.current).toBeNull();

    expect(jest.getTimerCount()).toBe(0);
  });

  test('restarts when the end time changes', () => {
    const { result, rerender } = renderHook(
      ({ endsAt }: { endsAt: string }) => useCountdownLabel(endsAt, 'Ending…'),
      { initialProps: { endsAt: '2026-05-09T09:59:00.000Z' } },
    );

    expect(result.current).toBe('Ending…');

    rerender({ endsAt: '2026-05-09T10:00:10.000Z' });

    expect(result.current).toBe('10s left');
  });
});
