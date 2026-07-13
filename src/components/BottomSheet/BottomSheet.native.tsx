import { useLayoutEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  DetentInfoEventPayload,
  SheetDetent,
  TrueSheetProps,
} from '@lodev09/react-native-true-sheet';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { theme } from '@app/styles/themes';

export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  enableFixedSnapPoints?: boolean;
  isPresented: boolean;
  onDismiss: () => void;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

/**
 * TrueSheet numeric detents are fractions of the screen height; the native
 * side rejects anything above 1, so point heights must be converted here.
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

  return snapPoint.fraction;
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
 * First-paint estimate of the visible sheet height for a fixed snap point.
 * The exact height arrives via the sheet's present/detent events (see
 * PresentedBottomSheet); this only has to be close enough that the initial
 * frame does not flash noticeably before the event lands.
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
  if (Platform.OS !== 'ios') {
    return { backgroundColor: theme.color.surfaceSunken.dark };
  }

  /**
   * Leaving background props unset opts into native Liquid Glass on iOS 26+;
   * setting either one disables it.
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
  showDragIndicator,
  snapPoints,
  testID,
}: BottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();

  if (!isPresented) {
    return null;
  }

  const fixedSnapPoint =
    enableFixedSnapPoints && snapPoints?.length ? snapPoints[0] : undefined;

  return (
    <PresentedBottomSheet
      detents={resolveDetents(enableFixedSnapPoints, snapPoints, windowHeight)}
      fixedSnapPoint={fixedSnapPoint}
      onDismiss={onDismiss}
      showDragIndicator={showDragIndicator}
      testID={testID}
    >
      {children}
    </PresentedBottomSheet>
  );
}

type PresentedBottomSheetProps = PropsWithChildren<{
  detents: SheetDetent[];
  fixedSnapPoint?: SnapPoint;
  onDismiss: () => void;
  showDragIndicator?: boolean;
  testID?: string;
}>;

function PresentedBottomSheet({
  children,
  detents,
  fixedSnapPoint,
  onDismiss,
  showDragIndicator,
  testID,
}: PresentedBottomSheetProps) {
  const sheetRef = useRef<TrueSheet>(null);
  const didDismissRef = useRef(false);
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  /**
   * TrueSheet sizes non-scrollable content by its intrinsic Yoga height (that
   * is how 'auto' detents measure), so at fixed detents flex-filling children
   * collapse to zero. Content therefore gets an explicit height: estimated for
   * first paint, then corrected to the native sheet frame reported by the
   * present/detent events. Keyed by windowHeight so rotation re-estimates
   * until the next settle event lands.
   */
  const [measured, setMeasured] = useState<{
    sheetHeight: number;
    windowHeight: number;
  } | null>(null);

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

  useLayoutEffect(() => {
    const sheet = sheetRef.current;

    return () => {
      /**
       * Consumers unmount the sheet immediately on close, so force a native
       * dismiss rather than relying on Fabric teardown timing. Skipped when
       * the user's own dismissal already completed (onDidDismiss fired).
       */
      if (!didDismissRef.current) {
        sheet?.dismiss(false).catch(() => undefined);
      }
    };
  }, []);

  return (
    <TrueSheet
      ref={sheetRef}
      detents={detents}
      initialDetentIndex={0}
      grabber={showDragIndicator === true}
      cornerRadius={theme.borderRadius28}
      {...resolveBackgroundProps()}
      onWillPresent={event => applyDetentInfo(event.nativeEvent)}
      onDidPresent={event => applyDetentInfo(event.nativeEvent)}
      onDetentChange={event => applyDetentInfo(event.nativeEvent)}
      onDidDismiss={() => {
        if (!didDismissRef.current) {
          didDismissRef.current = true;
          onDismiss();
        }
      }}
    >
      <View
        testID={testID}
        style={[
          styles.content,
          contentHeight !== undefined && { height: contentHeight },
          /**
           * The native grabber floats over the content instead of occupying a
           * row like the old JS pill did, so clear it explicitly.
           */
          showDragIndicator === true && styles.grabberClearance,
        ]}
      >
        {children}
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
});
