import {
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import React, { ReactNode, RefObject, forwardRef, useMemo } from 'react';
import { Pressable } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { Theme } from '../styles/theme';
import Box from './Box';
import Text from './Text';

interface BottomModalProps
  extends Omit<BottomSheetModalProps, 'snapPoints' | 'children'> {
  children: ReactNode;
  snapPoints?: (string | number)[] | SharedValue<(string | number)[]>;
  title?: string;
}

const BottomModal = forwardRef<BottomSheetModal, BottomModalProps>(
  ({ children, snapPoints, title, ...props }, ref) => {
    const theme = useTheme<Theme>();

    const initialSnapPoints = useMemo(() => ['50%'], []);

    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints || animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        enablePanDownToClose
        enableDismissOnClose
        backgroundStyle={{
          backgroundColor: theme.colors.secondaryBackground,
        }}
        handleStyle={{
          backgroundColor: theme.colors.secondaryBackground,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.secondaryText,
          width: 40,
          ...(title && {
            height: 0,
          }),
        }}
        {...props}
      >
        <BottomSheetView testID="bottomSheet" onLayout={handleContentLayout}>
          <Box
            flex={1}
            backgroundColor="secondaryBackground"
            paddingHorizontal="sToMtoM"
            {...(!title && {
              paddingVertical: 'sToMtoM',
            })}
          >
            {title && (
              <Box
                flexDirection="row"
                justifyContent="center"
                position="relative"
              >
                <Text
                  fontSize={16}
                  marginBottom="l"
                  alignSelf="center"
                  fontFamily="Roobert-SemiBold"
                >
                  Account
                </Text>
                <Box position="absolute" right={0}>
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      (ref as RefObject<BottomSheetModal>).current?.dismiss()
                    }
                  >
                    <Text
                      fontSize={16}
                      alignSelf="center"
                      fontFamily="Roobert-SemiBold"
                      color="gray2"
                    >
                      Done
                    </Text>
                  </Pressable>
                </Box>
              </Box>
            )}
            {children}
          </Box>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default BottomModal;

BottomModal.displayName = 'BottomModal';
