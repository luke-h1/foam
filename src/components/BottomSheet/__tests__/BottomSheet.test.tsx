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
      ref?: React.Ref<{ dismiss: () => Promise<void> }>;
    }) => {
      mockSheet.props = props;
      mockSheet.emitDidPresent = position =>
        onDidPresent?.({ nativeEvent: { detent: 0, index: 0, position } });
      mockSheet.emitDidDismiss = () => onDidDismiss?.();

      React.useImperativeHandle(ref, () => ({ dismiss: mockSheet.dismiss }));

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

  test('requestClose dismisses through the native sheet', () => {
    const ref = { current: null as BottomSheetHandle | null };

    renderSheet({ ref });
    ref.current?.requestClose();

    expect(mockSheet.dismiss).toHaveBeenCalledTimes(1);
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
