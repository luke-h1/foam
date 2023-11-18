import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import colors from '../styles/colors';

interface Props {
  children: ReactNode;
}

const Title = ({ children }: Props) => {
  return <Text style={styles.container}>{children}</Text>;
};

export default Title;

const styles = StyleSheet.create({
  container: {
    color: colors.gray,
    backgroundColor: colors.primary,
    fontSize: 14,
    textTransform: 'uppercase',
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 0,
    paddingRight: 0,
  },
});
