module.exports = api => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo']],
    plugins: [
      'transform-inline-environment-variables',
      // ORDER MATTERS - this must be always at the end
      'react-native-reanimated/plugin',
    ],
    env: {
      test: {
        presets: [
          [
            '@babel/preset-react',
            {
              runtime: 'automatic',
            },
          ],
        ],
      },
    },
  };
};
