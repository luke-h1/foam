import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetProps,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { forwardRef, ReactNode, useCallback } from 'react';
import { JSX } from 'react/jsx-runtime';
import { ViewStyle } from 'react-native';

interface BottomSheetModalProps extends BottomSheetProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const BottomSheetModal = forwardRef<BottomSheet, BottomSheetModalProps>(
  ({ children, ...rest }, ref) => {
    const renderBackdrop = useCallback(
      (props: JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={2}
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleComponent={null}
        {...rest}
      >
        {children}
      </BottomSheet>
    );
  },
);
BottomSheetModal.displayName = 'BottomSheetModal';
