import { Button, Icon } from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

// eslint-disable-next-line react/display-name
export const UserModal = forwardRef((props, ref) => {
  const { styles } = useStyles(stylesheet);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { logout, user } = useAuthContext();
  const navigation = useAppNavigation();
  const snapPoints = ['25%', '25%'];

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetModalRef.current?.present(),
    dismiss: () => bottomSheetModalRef.current?.dismiss(),
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          handleStyle={{ opacity: 0.95 }}
          {...props}
        >
          <BottomSheetView style={styles.container}>
            <Icon icon="arrow-right" />
            <Button
              onPress={async () => {
                bottomSheetModalRef.current?.dismiss();
                await logout();
                navigation.navigate('Tabs', {
                  screen: 'Top',
                });
              }}
            >
              Logout
            </Button>
          </BottomSheetView>
          <BottomSheetView style={styles.contentContainer}>
            <Icon icon="arrow-right" />
            <Button
              onPress={async () => {
                bottomSheetModalRef.current?.dismiss();
                navigation.navigate('Streams', {
                  screen: 'LiveStream',
                  params: {
                    id: user?.login as string,
                  },
                });
              }}
            >
              My stream
            </Button>
          </BottomSheetView>
          <BottomSheetView style={styles.contentContainer}>
            <Icon icon="arrow-right" />
            <Button
              onPress={async () => {
                bottomSheetModalRef.current?.dismiss();
                navigation.navigate('Streams', {
                  screen: 'StreamerProfile',
                  params: {
                    id: user?.login as string,
                  },
                });
              }}
            >
              My Profile
            </Button>
          </BottomSheetView>
          <BottomSheetView style={styles.contentContainer}>
            <Icon icon="arrow-right" />
            <Button
              onPress={async () => {
                bottomSheetModalRef.current?.dismiss();
              }}
            >
              Blocked users
            </Button>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
});

const stylesheet = createStyleSheet(() => ({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'grey',
  },
}));
