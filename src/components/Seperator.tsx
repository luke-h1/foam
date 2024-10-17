import { View } from 'react-native';

interface Props {
  color?: string;
  size?: number;
}

export default function Seperator({ color = 'blue', size = 0.5 }: Props) {
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
