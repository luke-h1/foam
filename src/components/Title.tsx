import { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import colors from '../styles/colors';

interface Props {
  children: ReactNode;
  underline?: boolean;
}

const Title = ({ children, underline }: Props) => {
  return (
    <Text style={[styles.container, underline ? styles.underline : undefined]}>
      {children}
    </Text>
  );
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
  underline: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.purple,
    textDecorationStyle: 'double',
  },
});
