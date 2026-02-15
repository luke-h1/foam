import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../Text/Text';

type Props = {
  left?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function SheetHeader({ left, right, style, title }: Props) {
  return (
    <View style={[styles.main, style]}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <Text weight="bold">{title}</Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  left: {
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  main: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
  },
  right: {
    bottom: 0,
    position: 'absolute',
    right: 0,
  },
});
