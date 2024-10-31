import theme from '@app/styles/theme';
import { StyleSheet, View, ViewStyle } from 'react-native';
import ThemedText from './ThemedText';

export interface HeaderProps {
  title: string;
  description?: string;
}

export default function Heading({ title, description }: HeaderProps) {
  return (
    <View style={styles.heading}>
      <View>
        <ThemedText
          marginBottom={theme.spacing.sm}
          fontSize={theme.fontSize.lg}
          fontWeight="bold"
        >
          {title}
        </ThemedText>
        {description && (
          <ThemedText fontSize={theme.fontSize.md} fontWeight="bold">
            {description}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  heading: ViewStyle;
}>({
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
});
