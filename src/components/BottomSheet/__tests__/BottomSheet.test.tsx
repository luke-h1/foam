import { createRef, useImperativeHandle } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import type {
  BottomSheetMethods,
  BottomSheetProps,
} from '@expo/ui/community/bottom-sheet';
import { act } from '@testing-library/react-native';

import render from '@app/test/render';

import { BottomSheet, type BottomSheetHandle } from '../BottomSheet.native';

jest.unmock('@app/components/BottomSheet/BottomSheet');

type SheetProps = {
  handleComponent?: unknown;
  index?: number;
  snapPoints?: (string | number)[];
};

type MockSheet = {
  close: jest.Mock;
  props: SheetProps;
  emitDismiss: () => void;
};

const mockSheet: MockSheet = {
  close: jest.fn(),
  props: {},
  emitDismiss: (): void => undefined,
};

/**
 * `require`, not `import * as`: babel's ES-interop wrapper copies the mocked
 * module, and jest.spyOn would patch the copy instead of what the component reads.
 */
// SAFETY: `require` erases module typing; this reattaches the real
// `@expo/ui/community/bottom-sheet` module type so `jest.spyOn` below type-checks.
const expoUiBottomSheet =
  require('@expo/ui/community/bottom-sheet') as typeof import('@expo/ui/community/bottom-sheet');

jest
  .spyOn(expoUiBottomSheet, 'BottomSheet')
  .mockImplementation(
    ({
      children,
      handleComponent,
      index,
      onDismiss,
      ref,
      snapPoints,
    }: BottomSheetProps) => {
      mockSheet.props = { handleComponent, index, snapPoints };
      mockSheet.emitDismiss = () => onDismiss?.();

      useImperativeHandle(ref, (): BottomSheetMethods => ({
        snapToIndex: jest.fn(),
        snapToPosition: jest.fn(),
        expand: jest.fn(),
        collapse: jest.fn(),
        close: mockSheet.close,
        forceClose: jest.fn(),
        present: jest.fn(),
        dismiss: jest.fn(),
      }));

      return <View>{children}</View>;
    },
  );

const windowHeight = Dimensions.get('window').height;

function renderSheet(props: Partial<Parameters<typeof BottomSheet>[0]> = {}) {
  return render(
    <BottomSheet
      isPresented
      onDismiss={jest.fn()}
      showDragIndicator
      testID='sheet'
      {...props}
    >
      <Text>sheet body</Text>
    </BottomSheet>,
  );
}

function getContentStyle(content: ReactTestInstance) {
  return StyleSheet.flatten(content.props.style);
}

function setPlatform(os: 'android' | 'ios') {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

describe('BottomSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setPlatform('ios');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders its children while presented', () => {
    const { queryByText } = renderSheet();

    expect(queryByText('sheet body')).toBeOnTheScreen();
  });

  test('closes the native sheet when not presented', () => {
    renderSheet({ isPresented: false });

    expect(mockSheet.props.index).toBe(-1);
  });

  test('presents at the first snap point', () => {
    renderSheet();

    expect(mockSheet.props.index).toBe(0);
  });

  describe('on ios', () => {
    test('passes snap points through as native detents', () => {
      renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ height: 320 }, { fraction: 0.6 }, 'full'],
      });

      expect(mockSheet.props.snapPoints).toEqual([320, '60%', '100%']);
    });

    test('rounds a fraction that multiplies to a float tail', () => {
      renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ fraction: 0.29 }],
      });

      expect(mockSheet.props.snapPoints).toEqual(['29%']);
    });

    test('clamps a fraction above one', () => {
      renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ fraction: 1.4 }],
      });

      expect(mockSheet.props.snapPoints).toEqual(['100%']);
    });

    test('fills the detent rather than sizing the content', () => {
      const { getByTestId } = renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ fraction: 0.9 }],
      });
      const style = getContentStyle(getByTestId('sheet'));

      expect(style.flex).toBe(1);
      expect(style.height).toBeUndefined();
    });

    test('leaves the sheet content-sized without enableFixedSnapPoints', () => {
      const { getByTestId } = renderSheet({ snapPoints: [{ fraction: 0.9 }] });
      const style = getContentStyle(getByTestId('sheet'));

      expect(mockSheet.props.snapPoints).toBeUndefined();
      expect(style.flex).toBeUndefined();
      expect(style.height).toBeUndefined();
    });
  });

  describe('on android', () => {
    beforeEach(() => {
      setPlatform('android');
    });

    test('sizes content from a fraction snap point instead of passing detents', () => {
      const { getByTestId } = renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ fraction: 0.9 }],
      });
      const style = getContentStyle(getByTestId('sheet'));

      expect(mockSheet.props.snapPoints).toBeUndefined();
      expect(style.height).toBe(Math.round(windowHeight * 0.9));
      expect(style.flex).toBeUndefined();
    });

    test('takes the first snap point when several are given', () => {
      const { getByTestId } = renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ height: 320 }, 'full'],
      });

      expect(getContentStyle(getByTestId('sheet')).height).toBe(320);
    });

    test('clamps a fixed height that exceeds the window', () => {
      const { getByTestId } = renderSheet({
        enableFixedSnapPoints: true,
        snapPoints: [{ height: windowHeight + 400 }],
      });

      expect(getContentStyle(getByTestId('sheet')).height).toBe(
        Math.round(windowHeight),
      );
    });
  });

  test('always hides the native drag indicator', () => {
    renderSheet();

    expect(mockSheet.props.handleComponent).toBeNull();
  });

  test('draws its own drag handle with showDragIndicator', () => {
    const { getByTestId } = renderSheet();

    expect(getByTestId('sheet-drag-handle')).toBeOnTheScreen();
  });

  test('draws no drag handle without showDragIndicator', () => {
    const { queryByTestId } = renderSheet({ showDragIndicator: false });

    expect(queryByTestId('sheet-drag-handle')).toBeNull();
  });

  test('requestClose closes the native sheet', () => {
    const ref = createRef<BottomSheetHandle>();

    renderSheet({ ref });
    ref.current?.requestClose();

    expect(mockSheet.close).toHaveBeenCalledTimes(1);
  });

  test('reports dismissal once the sheet has finished animating out', () => {
    const onDismiss = jest.fn();

    renderSheet({ onDismiss });
    act(() => mockSheet.emitDismiss());

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(350));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('reports a dismissal only once when the sheet fires twice', () => {
    const onDismiss = jest.fn();

    renderSheet({ onDismiss });
    act(() => mockSheet.emitDismiss());
    act(() => mockSheet.emitDismiss());
    act(() => jest.advanceTimersByTime(350));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not report a dismissal that a re-open took back', () => {
    const onDismiss = jest.fn();
    const { rerender } = renderSheet({ isPresented: false, onDismiss });

    act(() => mockSheet.emitDismiss());
    rerender(
      <BottomSheet isPresented onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );
    act(() => jest.advanceTimersByTime(350));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('does not report a dismissal after unmounting', () => {
    const onDismiss = jest.fn();
    const { unmount } = renderSheet({ onDismiss });

    act(() => mockSheet.emitDismiss());
    unmount();
    act(() => jest.advanceTimersByTime(350));

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
