import { StyleSheet, View } from 'react-native';

/**
 * The platform grabber cannot be restyled: `@expo/ui`'s `handleComponent` is
 * documented as not rendering on iOS or Android (only `null` vs non-null is
 * read), and `handleStyle` / `handleIndicatorStyle` have no effect there. So
 * the wrapper hides the native indicator and draws this as the first row of
 * sheet content instead, which puts the grabber on the sheet's own background
 * with no band or seam of its own.
 */
export function SheetDragHandle() {
  return (
    <View pointerEvents='none' style={styles.row} testID='sheet-drag-handle'>
      <View style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 2.5,
    height: 5,
    width: 36,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 8,
    width: '100%',
  },
});
