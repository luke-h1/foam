import { StyleSheet, useColorScheme, View } from 'react-native';

import { theme } from '@app/styles/themes';

import StoryBook from '../../../.rnstorybook';

export function StorybookScreen() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.color.background[scheme] },
      ]}
    >
      <StoryBook />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
