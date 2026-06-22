import { StyleSheet, View } from 'react-native';

import { theme } from '@app/styles/themes';

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
