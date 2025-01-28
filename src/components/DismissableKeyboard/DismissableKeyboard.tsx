import { ReactNode } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

interface Props {
  children: ReactNode;
}

export function DismissableKeyboard({ children }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
}
