import { ReactNode } from 'react';
import { Keyboard } from 'react-native';
import { Button } from '../Button';

interface Props {
  children: ReactNode;
}

export function DismissableKeyboard({ children }: Props) {
  return (
    <Button onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </Button>
  );
}
