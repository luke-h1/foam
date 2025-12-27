module.exports = api => {
  api.cache.using(() => process.env.NODE_ENV);

  const isTest = process.env.NODE_ENV === 'test';

  const plugins = [
    [
      'react-native-unistyles/plugin',
      {
        root: 'src',
      },
    ],
    // Don't inline env vars in tests so they can be mocked
    !isTest && 'transform-inline-environment-variables',
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
  ].filter(Boolean);

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
