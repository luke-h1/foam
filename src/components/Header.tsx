import { spacing } from '@app/styles';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './ui/Text';

export interface HeaderProps {
  title: string;
  description?: string;
}

export default function Heading({ title, description }: HeaderProps) {
  return (
    <View style={styles.heading}>
      <View>
        <Text>{title}</Text>
        {description && <Text>{description}</Text>}
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
    marginBottom: spacing.medium,
  },
});
