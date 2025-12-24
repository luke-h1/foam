import type { StorybookConfig } from '@storybook/react-native-web-vite';

const main: StorybookConfig = {
  stories: ['../src/**/*.stories.?(ts|tsx|js|jsx)'],
  // Note: addon-essentials removed due to version incompatibility with storybook v10
  addons: [],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        include: [
          /\.tsx?$/,
          /\.jsx?$/,
          /node_modules\/react-native-reanimated/,
        ],
        babel: {
          plugins: [
            [
              'react-native-unistyles/plugin',
              {
                root: 'src',
              },
            ],
            '@babel/plugin-proposal-export-namespace-from',
            'react-native-reanimated/plugin',
          ],
        },
      },
    },
  },
};

export default main;
