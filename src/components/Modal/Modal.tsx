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
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: theme.space12,
    minHeight: 44,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space16,
  },
  card: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    maxWidth: 340,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space28,
    width: '100%',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: theme.colorRedSurface,
    borderColor: theme.colorRedBorderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: theme.space16,
    minHeight: 44,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space16,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  subtitle: {
    color: theme.color.textSecondary.dark,
    marginBottom: theme.space20,
  },
  text: {
    color: theme.color.text.dark,
    marginBottom: theme.space12,
  },
});
