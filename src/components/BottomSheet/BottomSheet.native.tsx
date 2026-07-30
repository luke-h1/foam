import { useImperativeHandle, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren, Ref } from 'react';

import {
  BottomSheet as ExpoBottomSheet,
  type BottomSheetMethods,
} from '@expo/ui/community/bottom-sheet';
import { Toaster } from 'sonner-native';

import { theme } from '@app/styles/themes';

import type { BottomSheetHandle } from './bottomSheetHandle';

export type { BottomSheetHandle };
export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  ref?: Ref<BottomSheetHandle>;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

function resolveSheetHeight(
  snapPoint: SnapPoint,
  windowHeight: number,
): number | undefined {
  if (snapPoint === 'full') {
    return Math.round(windowHeight);
  }

  if ('height' in snapPoint) {
    return Math.min(Math.round(snapPoint.height), Math.round(windowHeight));
  }

  return Math.round(windowHeight * snapPoint.fraction);
}

export function BottomSheet({
  children,
  enableFixedSnapPoints,
  isPresented,
  onDismiss,
  ref,
  showDragIndicator,
  snapPoints,
  testID,
}: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetMethods>(null);

  useImperativeHandle(
    ref,
    () => ({
      requestClose: () => {
        sheetRef.current?.close();
      },
    }),
    [],
  );

  const [firstSnapPoint] = snapPoints ?? [];
  const sheetHeight =
    enableFixedSnapPoints && firstSnapPoint
      ? resolveSheetHeight(firstSnapPoint, windowHeight)
      : undefined;

  return (
    <ExpoBottomSheet
      ref={sheetRef}
      backgroundStyle={styles.background}
      enablePanDownToClose
      handleComponent={showDragIndicator ? undefined : null}
      index={isPresented ? 0 : -1}
      onDismiss={onDismiss}
    >
      <View
        style={
          sheetHeight === undefined
            ? styles.content
            : [styles.content, { height: sheetHeight }]
        }
        testID={testID}
      >
        {children}
        {process.env.EXPO_OS === 'android' ? (
          <Toaster style={styles.toaster} />
        ) : null}
      </View>
    </ExpoBottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: theme.color.surfaceElevated.dark,
  },
  content: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
  },
  toaster: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderWidth: 1,
  },
});
