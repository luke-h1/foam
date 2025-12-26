import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import StoryBook from '../../../.storybook';

export function StorybookScreen() {
  return (
    <View style={styles.container}>
      <StoryBook />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
}));
