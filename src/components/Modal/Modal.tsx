import { Modal as RNModal, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.gray.bgAlt,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderCurve: 'continuous',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.colors.gray.borderAlpha,
  },
  text: {
    color: theme.colors.gray.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.gray.textLow,
    marginBottom: theme.spacing.lg,
  },
  confirmButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.red.uiAlpha,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.red.borderAlpha,
    minHeight: 44,
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.gray.uiAlpha,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray.borderAlpha,
    minHeight: 44,
  },
  buttonText: {
    textAlign: 'center',
  },
}));
