import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export default function VisuallyHidden({ children, style }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      {children}
    </View>
  );
}
