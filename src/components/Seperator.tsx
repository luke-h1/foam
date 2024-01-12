import { Stack } from 'tamagui';
import { colors } from '../styles';

interface Props {
  color?: string;
  size?: number;
}

const Seperator = ({ color = colors.blue400, size = 0.5 }: Props) => {
  return (
    <Stack
      borderTopWidth={size}
      borderColor={color}
      marginTop={14}
      marginBottom={4}
    />
  );
};
export default Seperator;
