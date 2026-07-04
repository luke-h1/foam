import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import type { AppStateTransition } from '@app/utils/appState/appStateTransitions';
import {
  isForegroundTransition,
  subscribeToAppForeground,
  subscribeToAppStateTransitions,
} from '@app/utils/appState/appStateTransitions';

describe('appStateTransitions', () => {
  let changeHandler: ((nextState: AppStateStatus) => void) | undefined;
  let removeNativeSubscription: jest.Mock;
  const unsubscribes: (() => void)[] = [];

  const emit = (nextState: AppStateStatus) => {
    if (!changeHandler) {
      throw new Error('no AppState change handler registered');
    }
    changeHandler(nextState);
  };

  const track = (unsubscribe: () => void) => {
    unsubscribes.push(unsubscribe);
    return unsubscribe;
  };

  beforeEach(() => {
    changeHandler = undefined;
    removeNativeSubscription = jest.fn();
    AppState.currentState = 'active';
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, handler) => {
        changeHandler = handler;
        return { remove: removeNativeSubscription };
      });
  });

  afterEach(() => {
    while (unsubscribes.length > 0) {
      unsubscribes.pop()?.();
    }
  });

  test('delivers previous and current state pairs to transition listeners', () => {
    const received: { previous: AppStateStatus; current: AppStateStatus }[] =
      [];
    track(
      subscribeToAppStateTransitions(transition => {
        received.push(transition);
      }),
    );

    emit('background');
    emit('active');
    emit('inactive');
    emit('active');

    expect(received).toEqual<AppStateTransition[]>([
      { previous: 'active', current: 'background' },
      { previous: 'background', current: 'active' },
      { previous: 'active', current: 'inactive' },
      { previous: 'inactive', current: 'active' },
    ]);
  });

  test('fires foreground listeners when the app becomes active after background', () => {
    const onForeground = jest.fn();
    track(subscribeToAppForeground(onForeground));

    emit('background');
    expect(onForeground).toHaveBeenCalledTimes(0);

    emit('active');
    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  test('fires foreground listeners when the app becomes active after inactive', () => {
    const onForeground = jest.fn();
    track(subscribeToAppForeground(onForeground));

    emit('inactive');
    expect(onForeground).toHaveBeenCalledTimes(0);

    emit('active');
    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  test('does not fire foreground listeners when the app leaves active', () => {
    const onForeground = jest.fn();
    track(subscribeToAppForeground(onForeground));

    emit('inactive');
    emit('background');

    expect(onForeground).toHaveBeenCalledTimes(0);
  });

  test('stops delivering transitions after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = track(subscribeToAppStateTransitions(listener));

    emit('background');
    unsubscribe();
    emit('active');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      previous: 'active',
      current: 'background',
    });
  });

  test('unsubscribing one listener twice leaves other listeners subscribed', () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = track(subscribeToAppStateTransitions(first));
    track(subscribeToAppStateTransitions(second));

    unsubscribeFirst();
    unsubscribeFirst();
    emit('background');

    expect(first).toHaveBeenCalledTimes(0);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('shares one AppState subscription and removes it after the last unsubscribe', () => {
    const unsubscribeFirst = track(subscribeToAppStateTransitions(jest.fn()));
    const unsubscribeSecond = track(subscribeToAppStateTransitions(jest.fn()));

    expect(jest.mocked(AppState.addEventListener)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(AppState.addEventListener).mock.calls[0]?.[0]).toBe(
      'change',
    );

    unsubscribeFirst();
    expect(removeNativeSubscription).toHaveBeenCalledTimes(0);

    unsubscribeSecond();
    expect(removeNativeSubscription).toHaveBeenCalledTimes(1);
  });

  test('reseeds the previous state from AppState.currentState after full teardown', () => {
    const unsubscribe = track(subscribeToAppStateTransitions(jest.fn()));
    unsubscribe();

    AppState.currentState = 'background';
    const received: { previous: AppStateStatus; current: AppStateStatus }[] =
      [];
    track(
      subscribeToAppStateTransitions(transition => {
        received.push(transition);
      }),
    );

    emit('active');

    expect(received).toEqual<AppStateTransition[]>([
      { previous: 'background', current: 'active' },
    ]);
  });

  test('classifies foreground transitions', () => {
    expect(
      isForegroundTransition({ previous: 'background', current: 'active' }),
    ).toBe(true);
    expect(
      isForegroundTransition({ previous: 'inactive', current: 'active' }),
    ).toBe(true);
    expect(
      isForegroundTransition({ previous: 'active', current: 'inactive' }),
    ).toBe(false);
    expect(
      isForegroundTransition({ previous: 'active', current: 'background' }),
    ).toBe(false);
    expect(
      isForegroundTransition({ previous: 'unknown', current: 'active' }),
    ).toBe(false);
    expect(
      isForegroundTransition({ previous: 'inactive', current: 'background' }),
    ).toBe(false);
  });
});
