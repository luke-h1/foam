import { Gesture } from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import type {
  AnimatableValue,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Reanimated from 'react-native-reanimated';
import * as Worklets from 'react-native-worklets';

import { act, renderHook } from '@testing-library/react-native';

import { useComposerDismissGesture } from '@app/components/chat/components/chat-composer/hooks/use-composer-dismiss-gesture';

interface GestureEndEvent {
  translationY: number;
  velocityY: number;
}

interface GestureCallbacks {
  onEnd?: (event: GestureEndEvent) => void;
  onFinalize?: () => void;
  onUpdate?: (event: { translationY: number }) => void;
}

interface ComposerSpringConfig {
  damping: number;
  stiffness: number;
}

interface GestureMock {
  callbacks: GestureCallbacks;
  activeOffsetY: jest.Mock;
  direction: jest.Mock;
  failOffsetX: jest.Mock;
  onEnd: jest.Mock;
  onFinalize: jest.Mock;
  onUpdate: jest.Mock;
}

const mockDismiss = jest.mocked(KeyboardController.dismiss);

const mockSharedValue = {
  get: jest.fn(() => 0),
  set: jest.fn(),
};

const mockWithSpring = jest.fn(
  (value: number, _config?: ComposerSpringConfig) => value,
);

// SAFETY: the hook only calls .get()/.set() on the shared value, which this stub provides; the real SharedValue shape is not needed.
jest
  .spyOn(Reanimated, 'useSharedValue')
  .mockReturnValue(mockSharedValue as never);

jest
  .spyOn(Reanimated, 'withSpring')
  .mockImplementation((value: AnimatableValue, config?: WithSpringConfig) => {
    // SAFETY: the hook only ever springs the composer's numeric drag offset
    // with a damping/stiffness config, so this narrowing matches real usage.
    mockWithSpring(value as number, config as ComposerSpringConfig | undefined);
    return value;
  });

let mockLastFlingGesture: GestureMock;
let mockLastPanGesture: GestureMock;

function mockCreateGestureMock(): GestureMock {
  const callbacks: GestureCallbacks = {};

  const gesture: GestureMock = {
    callbacks,
    activeOffsetY: jest.fn(function activeOffsetY(this: GestureMock) {
      return this;
    }),
    direction: jest.fn(function direction(this: GestureMock) {
      return this;
    }),
    failOffsetX: jest.fn(function failOffsetX(this: GestureMock) {
      return this;
    }),
    onEnd: jest.fn(callback => {
      callbacks.onEnd = callback;
      return gesture;
    }),
    onFinalize: jest.fn(callback => {
      callbacks.onFinalize = callback;
      return gesture;
    }),
    onUpdate: jest.fn(callback => {
      callbacks.onUpdate = callback;
      return gesture;
    }),
  };

  return gesture;
}

// The root gesture-handler mock discards onEnd/onUpdate/onFinalize callbacks;
// these tests invoke them directly, so the stubs capture them on GestureMock.
const flingGestureStub = () => (mockLastFlingGesture = mockCreateGestureMock());

const panGestureStub = () => (mockLastPanGesture = mockCreateGestureMock());

const simultaneousGestureStub = (pan: GestureMock, fling: GestureMock) => ({
  gestures: [pan, fling],
  type: 'simultaneous',
});

// SAFETY: these stubs return GestureMock, not the real chainable-builder classes; only the captured callbacks are ever read back.
jest.spyOn(Gesture, 'Fling').mockImplementation(flingGestureStub as never);

// SAFETY: see above - panGestureStub returns GestureMock, not the real chainable-builder class.
jest.spyOn(Gesture, 'Pan').mockImplementation(panGestureStub as never);

// SAFETY: see above - simultaneousGestureStub returns GestureMock, not the real chainable-builder class.
jest
  .spyOn(Gesture, 'Simultaneous')
  .mockImplementation(simultaneousGestureStub as never);

// The root worklets mock schedules scheduleOnRN onto a microtask; these tests
// assert synchronously, so run it inline.
jest
  .spyOn(Worklets, 'scheduleOnRN')
  .mockImplementation((fn: () => void) => fn());

function getCallback<TName extends keyof GestureCallbacks>(
  gesture: GestureMock,
  name: TName,
): NonNullable<GestureCallbacks[TName]> {
  const callback = gesture.callbacks[name];

  if (!callback) {
    throw new Error(`the hook did not register ${name}`);
  }

  return callback;
}

describe('useComposerDismissGesture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clamps downward pan updates to the 64pt drag limit', () => {
    renderHook(() => useComposerDismissGesture());

    const onUpdate = getCallback(mockLastPanGesture, 'onUpdate');

    act(() => {
      onUpdate({ translationY: 114 });
      onUpdate({ translationY: -20 });
    });

    expect(mockSharedValue.set.mock.calls).toEqual([[64], [0]]);
  });

  test('dismisses when pan distance or velocity passes the dismiss threshold', () => {
    renderHook(() => useComposerDismissGesture());

    const onEnd = getCallback(mockLastPanGesture, 'onEnd');

    act(() => {
      onEnd({ translationY: 35, velocityY: 0 });
      onEnd({ translationY: 0, velocityY: 521 });
    });

    expect(mockDismiss).toHaveBeenCalledTimes(2);
  });

  test('does not dismiss when pan distance and velocity are at the threshold', () => {
    renderHook(() => useComposerDismissGesture());

    const onEnd = getCallback(mockLastPanGesture, 'onEnd');

    act(() => {
      onEnd({ translationY: 34, velocityY: 520 });
    });

    expect(mockDismiss).not.toHaveBeenCalled();
  });

  test('springs the drag offset back to zero when the pan finalizes', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      getCallback(mockLastPanGesture, 'onFinalize')();
    });

    expect(mockWithSpring.mock.calls.map(([target]) => target)).toEqual([0]);

    expect(mockSharedValue.set.mock.calls).toEqual([[0]]);

    expect(mockDismiss).not.toHaveBeenCalled();
  });

  test('dismisses on a fling', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      getCallback(
        mockLastFlingGesture,
        'onEnd',
      )({
        translationY: 0,
        velocityY: 0,
      });
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});
