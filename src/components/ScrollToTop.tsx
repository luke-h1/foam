import { colors } from '@app/styles';
import { TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from './ui/Text';

interface Props {
  onPress: () => void;
}

export default function ScrollToTop({ onPress }: Props) {
  return (
    <TouchableOpacity style={$topButton} onPress={onPress}>
      <Text style={$topText}>TOP</Text>
    </TouchableOpacity>
  );
}
const $topButton: ViewStyle = {
  position: 'absolute',
  bottom: 20,
  right: 20,
  backgroundColor: 'rgba(0,0,0,0.5)',
  borderRadius: 25,
  padding: 10,
};

const $topText: TextStyle = {
  color: colors.text,
  fontWeight: 'bold',
};
