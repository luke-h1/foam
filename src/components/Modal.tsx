import React from 'react';
import { Modal as RNModal, View } from 'react-native';
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
