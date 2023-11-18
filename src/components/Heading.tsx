import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../styles/colors';

interface Props {
  children: ReactNode;
}

const Heading = ({ children }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.headingText}>{children}</Text>
    </View>
  );
};
export default Heading;

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 20,
  },
  headingText: {
    color: colors.black,
    fontSize: 30,
  },
});
