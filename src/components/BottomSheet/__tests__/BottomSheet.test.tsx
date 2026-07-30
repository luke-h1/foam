import { Dimensions, StyleSheet, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import render from '@app/test/render';

import { BottomSheet, type BottomSheetHandle } from '../BottomSheet.native';

jest.unmock('@app/components/BottomSheet/BottomSheet');

const mockSheet = {
  close: jest.fn(),
  index: undefined as number | undefined,
  enablePanDownToClose: undefined as boolean | undefined,
  handleComponent: undefined as unknown,
};

jest.mock('@expo/ui/community/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({
      children,
      enablePanDownToClose,
      handleComponent,
      index,
      ref,
    }: {
      children?: React.ReactNode;
      enablePanDownToClose?: boolean;
      handleComponent?: unknown;
      index?: number;
      ref?: React.Ref<{ close: () => void }>;
    }) => {
      mockSheet.index = index;
      mockSheet.enablePanDownToClose = enablePanDownToClose;
      mockSheet.handleComponent = handleComponent;

      React.useImperativeHandle(ref, () => ({
        close: mockSheet.close,
      }));

      return index !== undefined && index >= 0
        ? React.createElement(View, null, children)
        : null;
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

function getSheetHeight(sheet: ReactTestInstance) {
  return StyleSheet.flatten(sheet.props.style).height;
}

describe('BottomSheet', () => {
  test('presents at index 0 and dismisses at index -1', () => {
    const { queryByText, rerender } = renderSheet();

    expect(mockSheet.index).toBe(0);
    expect(queryByText('sheet body')).toBeOnTheScreen();

    rerender(
      <BottomSheet isPresented={false} onDismiss={jest.fn()} testID='sheet'>
        <Text>sheet body</Text>
      </BottomSheet>,
    );

    expect(mockSheet.index).toBe(-1);
    expect(queryByText('sheet body')).not.toBeOnTheScreen();
  });

  test('resolves a fraction snap point against the window height', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ fraction: 0.9 }],
    });

    expect(getSheetHeight(getByTestId('sheet'))).toBe(
      Math.round(windowHeight * 0.9),
    );
  });

  test('clamps a fixed-height snap point to the window height', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ height: windowHeight + 400 }],
    });

    expect(getSheetHeight(getByTestId('sheet'))).toBe(Math.round(windowHeight));
  });

  test('resolves a full snap point to the window height', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: ['full'],
    });

    expect(getSheetHeight(getByTestId('sheet'))).toBe(Math.round(windowHeight));
  });

  test('takes the first snap point when several are given', () => {
    const { getByTestId } = renderSheet({
      enableFixedSnapPoints: true,
      snapPoints: [{ height: 320 }, 'full'],
    });

    expect(getSheetHeight(getByTestId('sheet'))).toBe(320);
  });

  test('leaves the content unsized without enableFixedSnapPoints', () => {
    const { getByTestId } = renderSheet({ snapPoints: [{ fraction: 0.9 }] });

    expect(getSheetHeight(getByTestId('sheet'))).toBeUndefined();
  });

  test('requestClose closes through the native sheet', () => {
    const ref = { current: null as BottomSheetHandle | null };

    renderSheet({ ref });
    ref.current?.requestClose();

    expect(mockSheet.close).toHaveBeenCalledTimes(1);
  });

  test('enables native pan-down dismissal and shows the native handle', () => {
    renderSheet();

    expect({
      enablePanDownToClose: mockSheet.enablePanDownToClose,
      handleComponent: mockSheet.handleComponent,
    }).toEqual({
      enablePanDownToClose: true,
      handleComponent: undefined,
    });
  });

  test('hides the native handle without showDragIndicator', () => {
    renderSheet({ showDragIndicator: false });

    expect(mockSheet.handleComponent).toBeNull();
  });
});
