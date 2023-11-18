import { View } from 'react-native';
import colors from '../styles/colors';

interface Props {
  color?: string;
  size?: number;
}

const Seperator = ({ color = colors.tag, size = 0.5 }: Props) => {
  return (
    <View
      style={{
        borderTopWidth: size,
        borderColor: color,
        marginTop: 14,
        marginBottom: 4,
      }}
    />
  );
};
export default Seperator;
