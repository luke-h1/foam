import { act, renderHook } from '@testing-library/react-native';
import {
  COMPOSER_DISMISS_DRAG_DISTANCE,
  COMPOSER_DISMISS_VELOCITY,
  COMPOSER_DRAG_LIMIT,
  dismissComposer,
  useComposerDismissGesture,
} from '../useComposerDismissGesture';

type GestureCallbacks = {
  onEnd?: (event: { translationY: number; velocityY: number }) => void;
  onFinalize?: () => void;
  onUpdate?: (event: { translationY: number }) => void;
};

type GestureMock = {
  callbacks: GestureCallbacks;
  activeOffsetY: jest.Mock<GestureMock, [number]>;
  direction: jest.Mock<GestureMock, [number]>;
  failOffsetX: jest.Mock<GestureMock, [[number, number]]>;
  onEnd: jest.Mock<GestureMock, [GestureCallbacks['onEnd']]>;
  onFinalize: jest.Mock<GestureMock, [GestureCallbacks['onFinalize']]>;
  onUpdate: jest.Mock<GestureMock, [GestureCallbacks['onUpdate']]>;
};

const mockDismiss = jest.fn();
const mockScheduleOnRN = jest.fn((fn: () => void) => fn());
const mockSharedValue = {
  get: jest.fn(() => 0),
  set: jest.fn(),
};
const mockWithSpring = jest.fn((value: number) => value);
let mockLastFlingGesture: GestureMock;
let mockLastPanGesture: GestureMock;

function mockCreateGestureMock(): GestureMock {
  const gesture = {
    callbacks: {},
  } as GestureMock;
  gesture.activeOffsetY = jest.fn(() => gesture);
  gesture.direction = jest.fn(() => gesture);
  gesture.failOffsetX = jest.fn(() => gesture);
  gesture.onEnd = jest.fn(callback => {
    gesture.callbacks.onEnd = callback;
    return gesture;
  });
  gesture.onFinalize = jest.fn(callback => {
    gesture.callbacks.onFinalize = callback;
    return gesture;
  });
  gesture.onUpdate = jest.fn(callback => {
    gesture.callbacks.onUpdate = callback;
    return gesture;
  });
  return gesture;
}

jest.mock('react-native-keyboard-controller', () => ({
  KeyboardController: {
    dismiss: mockDismiss,
  },
}));

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: mockScheduleOnRN,
}));

jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: jest.fn((updater: () => unknown) => updater()),
  useSharedValue: jest.fn(() => mockSharedValue),
  withSpring: mockWithSpring,
}));

jest.mock('react-native-gesture-handler', () => ({
  Directions: {
    DOWN: 4,
  },
  Gesture: {
    Fling: jest.fn(() => {
      mockLastFlingGesture = mockCreateGestureMock();
      return mockLastFlingGesture;
    }),
    Pan: jest.fn(() => {
      mockLastPanGesture = mockCreateGestureMock();
      return mockLastPanGesture;
    }),
    Simultaneous: jest.fn((pan: GestureMock, fling: GestureMock) => ({
      gestures: [pan, fling],
      type: 'simultaneous',
    })),
  },
}));

describe('useComposerDismissGesture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dismissComposer delegates to the keyboard controller', () => {
    dismissComposer();

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

    expect(mockScheduleOnRN.mock.calls).toEqual([
      [dismissComposer],
      [dismissComposer],
    ]);
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
    expect(mockScheduleOnRN.mock.calls).toEqual([[dismissComposer]]);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});
