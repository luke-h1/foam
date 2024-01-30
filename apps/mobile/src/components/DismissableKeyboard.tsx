import { ReactNode } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

interface Props {
  children: ReactNode;
}

const DismissableKeyboard = ({ children }: Props) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
};
export default DismissableKeyboard;
