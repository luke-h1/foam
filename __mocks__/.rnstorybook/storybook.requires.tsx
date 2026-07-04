// Prevents require.context from being called in the test environment.

export const view = {
  getStorybookUI: () => {
    const { View } = require('react-native');
    return () => <View testID='storybook-ui-mock' />;
  },
};
