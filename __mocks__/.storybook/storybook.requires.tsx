// Mock storybook.requires for Jest tests
// This prevents require.context from being called in test environment

export const view = {
  getStorybookUI: () => {
    const { View } = require('react-native');
    return () => <View testID="storybook-ui-mock" />;
  },
};

