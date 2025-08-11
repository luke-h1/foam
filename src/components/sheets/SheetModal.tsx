import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { ReactNode, Ref } from 'react';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { SheetBackdrop } from './SheetBackdrop';
import { SheetHeader } from './SheetHeader';

interface SheetModalProps {
  children: ReactNode;
  container?: 'view' | 'scroll';
  onClose?: () => void;
  ref?: Ref<BottomSheetModal>;
  right?: ReactNode;
  title: string;
}

export function SheetModal({
  children,
  title,
  container,
  onClose,
  ref,
  right,
}: SheetModalProps) {
  const frame = useSafeAreaFrame();

  const Container =
    container === 'scroll' ? BottomSheetScrollView : BottomSheetView;

  const styleProps =
    container === 'scroll'
      ? {
          contentContainerStyle: styles.content,
        }
      : {
          style: styles.content,
        };

  return (
    <BottomSheetModal
      backdropComponent={SheetBackdrop}
      backgroundStyle={styles.background}
      handleComponent={null}
      maxDynamicContentSize={frame.height * 0.8}
      onDismiss={onClose}
      ref={ref}
      stackBehavior="push"
    >
      <Container {...styleProps}>
        <SheetHeader right={right} style={styles.header} title={title} />

        {children}
      </Container>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  background: {
    backgroundColor: theme.colors.black.bgAlpha,
  },
  content: {
    paddingBottom: rt.insets.bottom,
  },
  header: {
    backgroundColor: 'transparent',
  },
}));
