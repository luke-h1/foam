import { colors, spacing } from '@app/styles';
import React from 'react';
import { Modal as RNModal, TextStyle, View, ViewStyle } from 'react-native';
import Button, { ButtonProps } from './ui/Button';
import { Text } from './ui/Text';

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

export default function Modal({
  cancelOnPress,
  confirmOnPress,
  title,
  isVisible,
  subtitle,
}: ModalProps) {
  return (
    <RNModal animationType="slide" transparent visible={isVisible}>
      <View style={$wrapper}>
        <View style={$card}>
          <Text preset="subheading" text={title} style={$textColor} />
          {subtitle ? <Text text={subtitle} style={$subtitle} /> : null}
          <Button
            shadowStyle={$confirmButton}
            onPress={confirmOnPress.cta}
            text={confirmOnPress.label}
          />
          <Button
            preset="link"
            style={$cancelButton}
            onPress={cancelOnPress.cta}
            text={cancelOnPress.label}
          />
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

const $card: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.medium,
  paddingHorizontal: spacing.large,
  paddingVertical: spacing.extraLarge,
  width: '80%',
};

const $textColor: TextStyle = {
  color: colors.palette.neutral800,
};

const $subtitle: TextStyle = {
  ...$textColor,
  marginTop: spacing.medium,
};

const $confirmButton: ViewStyle = {
  marginTop: spacing.large,
};

const $cancelButton: ViewStyle = {
  alignSelf: 'center',
  marginTop: spacing.extraLarge,
};
