import { ThemeColor } from '@app/styles';
import { View } from 'react-native';

interface Props {
  color?: ThemeColor;
  size?: number;
}

export function Seperator({ color = 'borderFaint', size = 0.5 }: Props) {
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
}
