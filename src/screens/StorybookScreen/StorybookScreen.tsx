import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';
import StoryBook from '../../../.rnstorybook';

export function StorybookScreen() {
  return (
    <View style={styles.container}>
      <StoryBook />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
