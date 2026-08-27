import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren, Ref } from 'react';

import {
  BottomSheet as ExpoBottomSheet,
  type BottomSheetMethods,
} from '@expo/ui/community/bottom-sheet';
import { Toaster } from 'sonner-native';

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

/**
 * The wrapper fires `onDismiss` when the dismissal starts and consumers unmount
 * on it, so the callback is held for the transition or the outro is cut short.
 */
const DISMISS_ANIMATION_MS = 350;

/**
 * Fractions stay fractional so the SwiftUI detent tracks rotation itself.
 */
function toDetent(snapPoint: SnapPoint): string | number {
  if (snapPoint === 'full') {
    return '100%';
  }

  if ('height' in snapPoint) {
    return Math.round(snapPoint.height);
  }

  // Rounded because float multiplication leaves a tail on some fractions, and
  // '28.999999999999996%' goes straight to the native detent.
  return `${Math.round(Math.min(1, snapPoint.fraction) * 100)}%`;
}

function resolveSheetHeight(
  snapPoint: SnapPoint,
  windowHeight: number,
): number {
  if (snapPoint === 'full') {
    return Math.round(windowHeight);
  }

  if ('height' in snapPoint) {
    return Math.min(Math.round(snapPoint.height), Math.round(windowHeight));
  }

  return Math.round(windowHeight * Math.min(1, snapPoint.fraction));
}

export function BottomSheet({
  backgroundColor = theme.color.menu.background,
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
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);

  useLayoutEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useImperativeHandle(
    ref,
    () => ({
      requestClose: () => {
        sheetRef.current?.close();
      },
    }),
    [],
  );

  /**
   * A re-open inside the dismiss window means the sheet never went away.
   */
  useEffect(() => {
    if (isPresented && dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, [isPresented]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const fixedSnapPoints =
    enableFixedSnapPoints && snapPoints?.length ? snapPoints : undefined;

  /**
   * iOS maps these onto `presentationDetents`; Android has no fractional
   * states, so it sizes to content and the content carries the resolved height.
   */
  const detents = useMemo(
    () => (Platform.OS === 'ios' ? fixedSnapPoints?.map(toDetent) : undefined),
    [fixedSnapPoints],
  );

  /**
   * A flexed child measures as zero against a host sizing to that child, so the
   * sheet would present blank. Only a detented sheet has a height to fill.
   */
  const [firstSnapPoint] = fixedSnapPoints ?? [];
  const sizingStyle = detents
    ? styles.fillsDetent
    : firstSnapPoint && {
        height: resolveSheetHeight(firstSnapPoint, windowHeight),
      };

  const backgroundStyle = useMemo(
    () => ({ backgroundColor }),
    [backgroundColor],
  );

  return (
    <ExpoBottomSheet
      ref={sheetRef}
      backgroundStyle={backgroundStyle}
      enablePanDownToClose
      handleComponent={null}
      index={isPresented ? 0 : -1}
      onDismiss={() => {
        if (dismissTimerRef.current !== null) {
          return;
        }
        dismissTimerRef.current = setTimeout(() => {
          dismissTimerRef.current = null;
          onDismissRef.current();
        }, DISMISS_ANIMATION_MS);
      }}
      snapPoints={detents}
    >
      <View style={[styles.content, sizingStyle]} testID={testID}>
        {showDragIndicator === true ? <SheetDragHandle /> : null}
        {children}
        {/**
         * The Android sheet sits above the app's Toaster, so toasts fired from
         * inside a sheet need a Toaster of their own.
         */}
        {process.env.EXPO_OS === 'android' ? (
          <Toaster style={styles.toaster} />
        ) : null}
      </View>
    </ExpoBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
  },
  fillsDetent: {
    flex: 1,
  },
  toaster: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderWidth: 1,
  },
});
