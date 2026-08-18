import { Gesture } from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import type {
  AnimatableValue,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Reanimated from 'react-native-reanimated';
import * as Worklets from 'react-native-worklets';

import { act, renderHook } from '@testing-library/react-native';

import { useComposerDismissGesture } from '@app/components/Chat/hooks/useComposerDismissGesture';
import {
  COMPOSER_DISMISS_DRAG_DISTANCE,
  COMPOSER_DISMISS_VELOCITY,
  COMPOSER_DRAG_LIMIT,
} from '@app/components/Chat/util/composerDismissConstants';

type GestureCallbacks = {
  onEnd?: (event: { translationY: number; velocityY: number }) => void;
  onFinalize?: () => void;
  onUpdate?: (event: { translationY: number }) => void;
};

type ComposerSpringConfig = {
  damping: number;
  stiffness: number;
};

type GestureMock = {
  callbacks: GestureCallbacks;
  activeOffsetY: jest.Mock;
  direction: jest.Mock;
  failOffsetX: jest.Mock;
  onEnd: jest.Mock;
  onFinalize: jest.Mock;
  onUpdate: jest.Mock;
};

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

// The root react-native-gesture-handler mock's chainable builders discard the
// callbacks passed to onEnd/onUpdate/onFinalize, but these tests need to
// invoke those callbacks directly to simulate gesture events. Only the
// callbacks/methods captured on GestureMock are ever read back, so the stubs
// below stand in for the real chainable-builder classes.
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

// react-native-worklets' root mock schedules scheduleOnRN onto a microtask;
// these tests assert the dismiss call synchronously right after the gesture
// callback fires, so it's overridden to run inline here.
const mockScheduleOnRN = jest
  .spyOn(Worklets, 'scheduleOnRN')
  .mockImplementation((fn: () => void) => fn());

describe('useComposerDismissGesture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dismissComposer delegates to the keyboard controller', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      mockLastPanGesture.callbacks.onEnd?.({
        translationY: COMPOSER_DISMISS_DRAG_DISTANCE + 1,
        velocityY: 0,
      });
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  test('creates pan and fling gestures with the expected thresholds', () => {
    const { result } = renderHook(() => useComposerDismissGesture());

    expect(result.current.composerAnimatedStyle).toEqual({
      transform: [{ translateY: 0 }],
    });
    expect(result.current.composerGesture).toEqual({
      gestures: [mockLastPanGesture, mockLastFlingGesture],
      type: 'simultaneous',
    });
    expect(mockLastPanGesture.activeOffsetY.mock.calls).toEqual([[4]]);
    expect(mockLastPanGesture.failOffsetX.mock.calls).toEqual([[[-40, 40]]]);
    expect(mockLastFlingGesture.direction.mock.calls).toEqual([[4]]);
  });

  test('clamps downward pan updates to the composer drag limit', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      mockLastPanGesture.callbacks.onUpdate?.({
        translationY: COMPOSER_DRAG_LIMIT + 50,
      });
      mockLastPanGesture.callbacks.onUpdate?.({ translationY: -20 });
    });

    expect(mockSharedValue.set.mock.calls).toEqual([
      [COMPOSER_DRAG_LIMIT],
      [0],
    ]);
  });

  test('dismisses when pan distance or velocity passes the dismiss threshold', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      mockLastPanGesture.callbacks.onEnd?.({
        translationY: COMPOSER_DISMISS_DRAG_DISTANCE + 1,
        velocityY: 0,
      });
      mockLastPanGesture.callbacks.onEnd?.({
        translationY: 0,
        velocityY: COMPOSER_DISMISS_VELOCITY + 1,
      });
    });

    expect(mockScheduleOnRN).toHaveBeenCalledTimes(2);
    expect(mockDismiss).toHaveBeenCalledTimes(2);
  });

  test('does not dismiss when pan distance and velocity are below threshold', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      mockLastPanGesture.callbacks.onEnd?.({
        translationY: COMPOSER_DISMISS_DRAG_DISTANCE,
        velocityY: COMPOSER_DISMISS_VELOCITY,
      });
    });

    expect(mockScheduleOnRN.mock.calls).toEqual([]);
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  test('resets the drag offset with a spring when the gesture finalizes and dismisses on fling', () => {
    renderHook(() => useComposerDismissGesture());

    act(() => {
      mockLastPanGesture.callbacks.onFinalize?.();
      mockLastFlingGesture.callbacks.onEnd?.({
        translationY: 0,
        velocityY: 0,
      });
    });

    expect(mockWithSpring.mock.calls[0]).toEqual([
      0,
      {
        damping: 18,
        stiffness: 220,
      },
    ]);
    expect(mockSharedValue.set.mock.calls.at(-1)).toEqual([0]);
    expect(mockScheduleOnRN).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});
