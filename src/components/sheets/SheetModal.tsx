import { theme } from '@app/styles/themes';
import { ReactNode } from 'react';
import { Modal, ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetHeader } from './SheetHeader';

interface SheetModalProps {
  children: ReactNode;
  visible: boolean;
  container?: 'view' | 'scroll';
  onClose?: () => void;
  right?: ReactNode;
  title: string;
}

export function SheetModal({
  children,
  visible,
  title,
  container,
  onClose,
  right,
}: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const Container = container === 'scroll' ? ScrollView : View;

  const styleProps =
    container === 'scroll'
      ? {
          contentContainerStyle: [
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ],
        }
      : {
          style: [
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ],
        };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <Container {...styleProps}>
        <SheetHeader right={right} style={styles.header} title={title} />

        {children}
      </Container>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: theme.colors.black.bgAlpha,
    flexGrow: 1,
  },
  header: {
    backgroundColor: 'transparent',
  },
});
