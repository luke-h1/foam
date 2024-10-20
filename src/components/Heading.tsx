import theme from '@app/styles/theme';
import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import ThemedText from './ThemedText';

export interface HeadingProps {
  title: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export default function Heading({ title, iconLeft, iconRight }: HeadingProps) {
  return (
    <SafeAreaView style={styles.heading}>
      {iconLeft && <View style={styles.icon}>{iconLeft}</View>}
      <ThemedText
        marginBottom={theme.spacing.sm}
        fontSize={theme.fontSize.lg}
        fontWeight="bold"
        style={styles.title}
      >
        {title}
      </ThemedText>
      {iconRight && <View style={styles.icon}>{iconRight}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.color.white,
  },
  icon: {
    marginHorizontal: theme.spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginBottom: 0,
    paddingBottom: 0,
  },
});
