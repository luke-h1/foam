import { theme } from '@app/styles/themes';
import { Modal as RNModal, View, StyleSheet } from 'react-native';
import { Button, ButtonProps } from '../Button/Button';
import { Text } from '../Text/Text';

interface OnPressProps extends ButtonProps {
  cta: () => void;
  label: string;
}

interface ModalProps {
  title: string;
  subtitle?: string;
  confirmOnPress: OnPressProps;
  cancelOnPress: OnPressProps;
  isVisible?: boolean;
}

export function Modal({
  cancelOnPress,
  confirmOnPress,
  title,
  isVisible,
  subtitle,
}: ModalProps) {
  return (
    <RNModal animationType="fade" transparent visible={isVisible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.text}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Button
            onPress={confirmOnPress.cta}
            style={styles.confirmButton}
            disabled={confirmOnPress.disabled}
          >
            <Text weight="semibold" color="red" style={styles.buttonText}>
              {confirmOnPress.label}
            </Text>
          </Button>
          <Button
            style={styles.cancelButton}
            onPress={cancelOnPress.cta}
            disabled={cancelOnPress.disabled}
          >
            <Text weight="semibold" color="gray" style={styles.buttonText}>
              {cancelOnPress.label}
            </Text>
          </Button>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    textAlign: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.gray.bgAlt,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    maxWidth: 340,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.red.uiAlpha,
    borderColor: theme.colors.red.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  subtitle: {
    color: theme.colors.gray.textLow,
    marginBottom: theme.spacing.lg,
  },
  text: {
    color: theme.colors.gray.text,
    marginBottom: theme.spacing.sm,
  },
});
