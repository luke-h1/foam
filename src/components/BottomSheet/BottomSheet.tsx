import { memo, useImperativeHandle } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren, Ref } from 'react';

import { theme } from '@app/styles/themes';

import type { BottomSheetHandle } from './bottomSheetHandle';
import { SheetDragHandle } from './SheetDragHandle';

export type { BottomSheetHandle };
export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  backgroundColor?: string;
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  ref?: Ref<BottomSheetHandle>;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

function BottomSheetComponent({
  backgroundColor = theme.color.menu.background,
  children,
  isPresented,
  onDismiss,
  ref,
  showDragIndicator,
  testID,
}: BottomSheetProps) {
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
      style={[
        styles.fallback,
        { backgroundColor, width: Math.min(windowWidth - 32, 520) },
      ]}
    >
      {showDragIndicator ? <SheetDragHandle /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'stretch',
    alignSelf: 'center',
  },
});

export const BottomSheet = memo(BottomSheetComponent);
