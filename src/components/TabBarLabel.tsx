import theme from '@app/styles/theme';
import { ReactNode } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
}

export default function TabBarLabel({ children }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create<{ container: ViewStyle; text: TextStyle }>({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  text: {
    color: theme.color.black,
    fontSize: 16,
    justifyContent: 'flex-start',
    textAlign: 'center',
    maxWidth: '100%',
  },
});
