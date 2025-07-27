module.exports = api => {
  api.cache(true);

  const plugins = [
    [
      'react-native-unistyles/plugin',
      {
        root: 'src',
      },
    ],
    'transform-inline-environment-variables',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@app': './src',
        },
      },
    ],
    // ORDER MATTERS - this must be always at the end
    'react-native-reanimated/plugin',
  ];

  return {
    presets: [['babel-preset-expo']],
    plugins,
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
