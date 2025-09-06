import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

type Props = BottomSheetBackdropProps;

export function SheetBackdrop({ animatedIndex, animatedPosition }: Props) {
  return (
    <BottomSheetBackdrop
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={1}
    />
  );
}
