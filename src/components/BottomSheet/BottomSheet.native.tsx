import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren, Ref } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  DetentInfoEventPayload,
  SheetDetent,
  TrueSheetProps,
} from '@lodev09/react-native-true-sheet';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
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

/**
 * TrueSheet numeric detents are fractions of the available height; native
 * rejects anything above 1, so point heights must be converted here.
 */
function resolveDetent(
  snapPoint: SnapPoint,
  windowHeight: number,
): SheetDetent {
  if (snapPoint === 'full') {
    return 1;
  }

  if ('height' in snapPoint) {
    return Math.min(1, snapPoint.height / windowHeight);
  }

  return Math.min(1, snapPoint.fraction);
}

function resolveDetents(
  enableFixedSnapPoints: boolean | undefined,
  snapPoints: SnapPoint[] | undefined,
  windowHeight: number,
): SheetDetent[] {
  if (!enableFixedSnapPoints || !snapPoints?.length) {
    return ['auto'];
  }

  return snapPoints
    .slice(0, 3)
    .map(snapPoint => resolveDetent(snapPoint, windowHeight));
}

/**
 * First-paint estimate of the visible sheet height for a fixed snap point. The
 * exact height arrives via the present/detent events; this only has to be close
 * enough that the first frame does not visibly flash before the event lands.
 */
function estimateContentHeight(
  snapPoint: SnapPoint,
  windowHeight: number,
  topInset: number,
): number {
  const maxSheetHeight = windowHeight - topInset;

  if (snapPoint === 'full') {
    return maxSheetHeight;
  }

  if ('height' in snapPoint) {
    return Math.min(snapPoint.height, maxSheetHeight);
  }

  return Math.min(snapPoint.fraction * windowHeight, maxSheetHeight);
}

function resolveBackgroundProps(): Pick<
  TrueSheetProps,
  'backgroundBlur' | 'backgroundColor'
> {
  if (process.env.EXPO_OS !== 'ios') {
    return { backgroundColor: theme.color.surfaceElevated.dark };
  }

  /**
   * Leaving both background props unset opts into native Liquid Glass on
   * iOS 26+; setting either one disables it.
   */
  if (isLiquidGlassAvailable()) {
    return {};
  }

  return {
    backgroundBlur: 'dark',
    backgroundColor: 'rgba(10,10,12,0.55)',
  };
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
  const sheetRef = useRef<TrueSheet>(null);
  const didDismissRef = useRef(false);
  /**
   * iOS marks the sheet presented only in viewDidAppear, and the native
   * dismiss guard treats a still-animating-in sheet as already dismissed - the
   * promise resolves without dismissing and onDidDismiss never fires. So a
   * close that arrives before onDidPresent has to be queued, not issued.
   */
  const presentedRef = useRef(false);
  const pendingDismissRef = useRef(false);
  /**
   * TrueSheet must stay mounted until the native dismissal completes: if it
   * unmounted in the same commit that flips `isPresented` false, its native
   * ref would already be detached by the time any effect cleanup runs, the JS
   * dismiss would throw, and iOS would fall back to a dealloc-time
   * `dismissViewControllerAnimated:YES` on the root presenting controller,
   * which also tears down anything else presented beneath the sheet.
   */
  const [isMounted, setIsMounted] = useState(isPresented);
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  /**
   * TrueSheet sizes non-scrollable content by its intrinsic Yoga height (that
   * is how the 'auto' detent measures), so at a fixed detent flex-filling
   * children collapse to zero and the sheet presents blank. Content therefore
   * gets an explicit height: estimated for first paint, then corrected to the
   * native sheet frame reported by the present/detent events. Keyed by
   * windowHeight so rotation re-estimates until the next event lands.
   */
  const [measured, setMeasured] = useState<{
    sheetHeight: number;
    windowHeight: number;
  } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      requestClose: () => {
        if (!presentedRef.current) {
          pendingDismissRef.current = true;
          return;
        }
        sheetRef.current?.dismiss().catch(() => undefined);
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    if (isPresented) {
      didDismissRef.current = false;
      pendingDismissRef.current = false;
      setIsMounted(true);
      return;
    }

    /**
     * Prop-driven close: dismiss natively while TrueSheet is still mounted and
     * let onDidDismiss unmount it, mirroring requestClose (including the
     * queue-until-presented handling). With no sheet mounted, the ref is null
     * and this is a no-op beyond the pending flag, which the next presentation
     * clears.
     */
    if (!didDismissRef.current) {
      if (!presentedRef.current) {
        pendingDismissRef.current = true;
        return;
      }
      sheetRef.current?.dismiss().catch(() => undefined);
    }
  }, [isPresented]);

  useLayoutEffect(() => {
    return () => {
      /**
       * Whole-component unmount: this cleanup runs before the TrueSheet child
       * detaches (React deletes parents first), so the ref is still live and a
       * non-animated dismiss can be issued directly. Skipped once the
       * dismissal already completed (onDidDismiss fired).
       */
      if (!didDismissRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the latest ref is wanted at teardown; capturing at effect time would read null before TrueSheet mounts
        sheetRef.current?.dismiss(false).catch(() => undefined);
      }
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  const fixedSnapPoint =
    enableFixedSnapPoints && snapPoints?.length ? snapPoints[0] : undefined;

  const applyDetentInfo = ({ position }: DetentInfoEventPayload) => {
    const sheetHeight = Math.round(windowHeight - position);

    if (sheetHeight > 0) {
      setMeasured(previous =>
        previous?.sheetHeight === sheetHeight &&
        previous.windowHeight === windowHeight
          ? previous
          : { sheetHeight, windowHeight },
      );
    }
  };

  let contentHeight: number | undefined;
  if (fixedSnapPoint !== undefined) {
    contentHeight =
      measured?.windowHeight === windowHeight
        ? measured.sheetHeight
        : estimateContentHeight(fixedSnapPoint, windowHeight, topInset);
  }

  return (
    <TrueSheet
      ref={sheetRef}
      cornerRadius={theme.borderRadius28}
      detents={resolveDetents(enableFixedSnapPoints, snapPoints, windowHeight)}
      grabber={showDragIndicator === true}
      initialDetentIndex={0}
      maxContentHeight={
        fixedSnapPoint === undefined ? windowHeight - topInset : undefined
      }
      onDetentChange={event => applyDetentInfo(event.nativeEvent)}
      onDidDismiss={() => {
        presentedRef.current = false;
        pendingDismissRef.current = false;
        setIsMounted(false);
        setMeasured(null);
        if (!didDismissRef.current) {
          didDismissRef.current = true;
          onDismiss();
        }
      }}
      onDidPresent={event => {
        presentedRef.current = true;
        applyDetentInfo(event.nativeEvent);
        if (pendingDismissRef.current) {
          pendingDismissRef.current = false;
          sheetRef.current?.dismiss().catch(() => undefined);
        }
      }}
      onWillPresent={event => applyDetentInfo(event.nativeEvent)}
      {...resolveBackgroundProps()}
    >
      <View
        testID={testID}
        style={[
          styles.content,
          contentHeight !== undefined && { height: contentHeight },
          /**
           * The native grabber floats over the content instead of occupying a
           * row of its own, so clear it explicitly.
           */
          showDragIndicator === true && styles.grabberClearance,
        ]}
      >
        {children}
        {/**
         * The sheet is added to android.R.id.content, above the react root and
         * therefore above the app's Toaster, so toasts fired from inside a sheet
         * (badge/emote copy and save) need a Toaster of their own.
         */}
        {process.env.EXPO_OS === 'android' ? (
          <Toaster style={styles.toaster} />
        ) : null}
      </View>
    </TrueSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
  },
  grabberClearance: {
    paddingTop: 20,
  },
  toaster: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderWidth: 1,
  },
});
