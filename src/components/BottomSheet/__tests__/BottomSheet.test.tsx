import { Dimensions, StyleSheet, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { act } from '@testing-library/react-native';

import render from '@app/test/render';

import { BottomSheet, type BottomSheetHandle } from '../BottomSheet.native';

jest.unmock('@app/components/BottomSheet/BottomSheet');

type SheetProps = {
  cornerRadius?: number;
  detents?: (number | string)[];
  grabber?: boolean;
  initialDetentIndex?: number;
  maxContentHeight?: number;
};

const mockSheet = {
  dismiss: jest.fn(() => Promise.resolve()),
  present: jest.fn(() => Promise.resolve()),
  props: {} as SheetProps,
  emitDidPresent: (_position: number): void => undefined,
  emitDidDismiss: (): void => undefined,
};

jest.mock('@lodev09/react-native-true-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    TrueSheet: ({
      children,
      onDidDismiss,
      onDidPresent,
      ref,
      ...props
    }: SheetProps & {
      children?: React.ReactNode;
      onDidDismiss?: () => void;
      onDidPresent?: (event: {
        nativeEvent: { detent: number; index: number; position: number };
      }) => void;
      ref?: React.Ref<{
        dismiss: () => Promise<void>;
        present: () => Promise<void>;
      }>;
    }) => {
      mockSheet.props = props;
      mockSheet.emitDidPresent = position =>
        onDidPresent?.({ nativeEvent: { detent: 0, index: 0, position } });
      mockSheet.emitDidDismiss = () => onDidDismiss?.();

      React.useImperativeHandle(ref, () => ({
        dismiss: mockSheet.dismiss,
        present: mockSheet.present,
      }));

      return React.createElement(View, null, children);
    },
  };
});

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

function getContentHeight(content: ReactTestInstance) {
  return StyleSheet.flatten(content.props.style).height;
}

describe('BottomSheet', () => {
  test('renders its children while presented', () => {
    const { queryByText } = renderSheet();

    expect(queryByText('sheet body')).toBeOnTheScreen();
  });

  test('renders nothing when not presented', () => {
    const { queryByText } = renderSheet({ isPresented: false });

    expect(queryByText('sheet body')).not.toBeOnTheScreen();
  });

  test('presents at the first detent on mount', () => {
    renderSheet();

    expect(mockSheet.props.initialDetentIndex).toBe(0);
  });

  test('uses an auto detent without enableFixedSnapPoints', () => {
    renderSheet({ snapPoints: [{ fraction: 0.9 }] });

    expect(mockSheet.props.detents).toEqual(['auto']);
  });

  test('converts snap points to detent fractions', () => {
    renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ height: windowHeight / 4 }, { fraction: 0.6 }, 'full'],
    });

    expect(mockSheet.props.detents).toEqual([0.25, 0.6, 1]);
  });

  test('clamps a fixed-height detent that exceeds the window', () => {
    renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ height: windowHeight + 400 }],
    });

    expect(mockSheet.props.detents).toEqual([1]);
  });

  test('caps the auto detent to the window height', () => {
    renderSheet();

    expect(mockSheet.props.maxContentHeight).toBe(windowHeight);
  });

  test('leaves the auto cap off for fixed snap points', () => {
    renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ fraction: 0.9 }],
    });

    expect(mockSheet.props.maxContentHeight).toBeUndefined();
  });

  test('sizes content from a fraction snap point', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ fraction: 0.9 }],
    });

    expect(getContentHeight(getByTestId('sheet'))).toBe(windowHeight * 0.9);
  });

  test('takes the first snap point when several are given', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ height: 320 }, 'full'],
    });

    expect(getContentHeight(getByTestId('sheet'))).toBe(320);
  });

  test('leaves the content unsized without enableFixedSnapPoints', () => {
    const { getByTestId } = renderSheet({ snapPoints: [{ fraction: 0.9 }] });

    expect(getContentHeight(getByTestId('sheet'))).toBeUndefined();
  });

  test('corrects the content height to the presented sheet frame', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ fraction: 0.9 }],
    });

    act(() => mockSheet.emitDidPresent(windowHeight - 512));

    expect(getContentHeight(getByTestId('sheet'))).toBe(512);
  });

  test('shows the native grabber with showDragIndicator', () => {
    renderSheet();

    expect(mockSheet.props.grabber).toBe(true);
  });

  test('hides the native grabber without showDragIndicator', () => {
    renderSheet({ showDragIndicator: false });

    expect(mockSheet.props.grabber).toBe(false);
  });

  test('requestClose dismisses through the native sheet once presented', () => {
    const ref = { current: null as BottomSheetHandle | null };

    renderSheet({ ref });
    act(() => mockSheet.emitDidPresent(windowHeight - 400));
    ref.current?.requestClose();

    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
  });

  test('queues requestClose until the sheet has presented', () => {
    const ref = { current: null as BottomSheetHandle | null };

    renderSheet({ ref });
    ref.current?.requestClose();

    expect(mockSheet.dismiss).not.toHaveBeenCalled();

    act(() => mockSheet.emitDidPresent(windowHeight - 400));

    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
  });

  test('dismisses natively when isPresented flips false, then reports dismissal', () => {
    const onDismiss = jest.fn();
    const { queryByText, rerender } = renderSheet({ onDismiss });

    act(() => mockSheet.emitDidPresent(windowHeight - 400));
    rerender(
      <BottomSheet isPresented={false} onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );

    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
    expect(queryByText('sheet body')).toBeOnTheScreen();
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => mockSheet.emitDidDismiss());

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(queryByText('sheet body')).not.toBeOnTheScreen();
  });

  test('re-presents instead of reporting a close that a re-open superseded', () => {
    const onDismiss = jest.fn();
    const { queryByText, rerender } = renderSheet({ onDismiss });

    act(() => mockSheet.emitDidPresent(windowHeight - 400));
    rerender(
      <BottomSheet isPresented={false} onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet isPresented onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );
    act(() => mockSheet.emitDidDismiss());

    expect(mockSheet.present).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(queryByText('sheet body')).toBeOnTheScreen();
  });

  test('reports a swipe-down dismissal while isPresented is still true', () => {
    const onDismiss = jest.fn();

    renderSheet({ onDismiss });
    act(() => mockSheet.emitDidPresent(windowHeight - 400));
    act(() => mockSheet.emitDidDismiss());

    expect(mockSheet.present).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('reports a requestClose dismissal while isPresented is still true', () => {
    const onDismiss = jest.fn();
    const ref = { current: null as BottomSheetHandle | null };

    renderSheet({ onDismiss, ref });
    act(() => mockSheet.emitDidPresent(windowHeight - 400));
    act(() => ref.current?.requestClose());
    act(() => mockSheet.emitDidDismiss());

    expect(mockSheet.present).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('reports a swipe-down dismissal after a re-open cancelled a queued close', () => {
    const onDismiss = jest.fn();
    const { rerender } = renderSheet({ onDismiss });

    rerender(
      <BottomSheet isPresented={false} onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet isPresented onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );
    act(() => mockSheet.emitDidPresent(windowHeight - 400));

    expect(mockSheet.dismiss).not.toHaveBeenCalled();

    act(() => mockSheet.emitDidDismiss());

    expect(mockSheet.present).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('queues a prop-driven close that lands before the sheet presents', () => {
    const onDismiss = jest.fn();
    const { rerender } = renderSheet({ onDismiss });

    rerender(
      <BottomSheet isPresented={false} onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );

    expect(mockSheet.dismiss).not.toHaveBeenCalled();

    act(() => mockSheet.emitDidPresent(windowHeight - 400));

    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
  });

  test('mounts and presents when isPresented flips true after mount', () => {
    const onDismiss = jest.fn();
    const { queryByText, rerender } = renderSheet({
      isPresented: false,
      onDismiss,
    });

    expect(queryByText('sheet body')).not.toBeOnTheScreen();

    rerender(
      <BottomSheet isPresented onDismiss={onDismiss} showDragIndicator>
        <Text>sheet body</Text>
      </BottomSheet>,
    );

    expect(queryByText('sheet body')).toBeOnTheScreen();
  });

  test('force-dismisses a still-presented sheet on unmount', () => {
    const { unmount } = renderSheet();

    unmount();

    expect(mockSheet.dismiss).toHaveBeenCalledWith(false);
  });

  test('does not re-dismiss on unmount after the sheet dismissed itself', () => {
    const { unmount } = renderSheet();

    act(() => mockSheet.emitDidDismiss());
    unmount();

    expect(mockSheet.dismiss).not.toHaveBeenCalled();
  });

  test('reports dismissal once the native sheet has dismissed', () => {
    const onDismiss = jest.fn();

    renderSheet({ onDismiss });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => mockSheet.emitDidDismiss());
    act(() => mockSheet.emitDidDismiss());

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
