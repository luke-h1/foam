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
    'react-native-worklets/plugin',
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
