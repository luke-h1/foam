import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../styles/colors';

interface Props {
  children: ReactNode;
  fontSize?: number;
  paddingBottom?: number;
  color?: string;
}

const Heading = ({
  children,
  fontSize = 30,
  paddingBottom = 20,
  color = colors.black,
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={[{ fontSize, paddingBottom, color }]}>{children}</Text>
    </View>
  );
};
export default Heading;

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingLeft: 0,
    paddingRight: 0,
  },
});
