import { forwardRef, memo, useImperativeHandle } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import type { BottomSheetHandle } from './bottomSheetHandle';

export type { BottomSheetHandle };
export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

const BottomSheetComponent = forwardRef<BottomSheetHandle, BottomSheetProps>(
  function BottomSheetComponent(
    { children, isPresented, onDismiss, showDragIndicator, testID },
    ref,
  ) {
    const { width: windowWidth } = useWindowDimensions();

    useImperativeHandle(
      ref,
      () => ({
        requestClose: () => {
          onDismiss();
        },
      }),
      [onDismiss],
    );

    if (!isPresented) {
      return null;
    }

    return (
      <View
        testID={testID}
        style={[styles.fallback, { width: Math.min(windowWidth - 32, 520) }]}
      >
        {showDragIndicator ? (
          <View style={styles.dragHandleRow}>
            <View style={styles.dragIndicator} />
          </View>
        ) : null}
        {children}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  dragHandleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    paddingTop: 10,
    width: '100%',
  },
  dragIndicator: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderRadius: 999,
    height: 4,
    width: 36,
  },
  fallback: {
    alignItems: 'stretch',
    alignSelf: 'center',
  },
});

export const BottomSheet = memo(BottomSheetComponent);
