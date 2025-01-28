import React from 'react';
import { Modal as RNModal, View, ViewStyle } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button, ButtonProps } from '../Button';
import { Typography } from '../Typography';

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
  const { styles } = useStyles(stylesheet);

  return (
    <RNModal animationType="slide" transparent visible={isVisible}>
      <View style={$wrapper}>
        <View style={styles.card}>
          <Typography style={styles.text}>{title}</Typography>
          {subtitle ? (
            <Typography style={styles.subtitle}>{subtitle}</Typography>
          ) : null}
          <Button onPress={confirmOnPress.cta} style={styles.confirmButton}>
            {confirmOnPress.label}
          </Button>
          <Button style={styles.cancelButton} onPress={cancelOnPress.cta}>
            {cancelOnPress.label}
          </Button>
        </View>
      </View>
    </RNModal>
  );
}

const $wrapper: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
};

const stylesheet = createStyleSheet(theme => ({
  card: {
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    width: '80%',
  },
  text: {
    color: theme.colors.borderFaint,
  },
  subtitle: {
    marginTop: theme.spacing.md,
    color: theme.colors.borderFaint,
  },
  confirmButton: {
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
  },
}));
