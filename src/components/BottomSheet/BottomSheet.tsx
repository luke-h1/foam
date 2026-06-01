import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export type SnapPoint = { fraction: number } | { height: number } | 'full';

type BottomSheetProps = PropsWithChildren<{
  isPresented: boolean;
  onDismiss: () => void;
  showDragIndicator?: boolean;
  snapPoints?: SnapPoint[];
  testID?: string;
}>;

export function BottomSheet({
  children,
  isPresented,
  showDragIndicator,
  testID,
}: BottomSheetProps) {
  if (!isPresented) {
    return null;
  }

  return (
    <View testID={testID} style={styles.fallback}>
      {showDragIndicator ? <View style={styles.dragIndicator} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dragIndicator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 999,
    height: 4,
    marginBottom: 8,
    marginTop: 8,
    width: 36,
  },
  fallback: {
    alignItems: 'center',
  },
});
