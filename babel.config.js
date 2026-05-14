module.exports = api => {
  api.cache.using(() => process.env.NODE_ENV);

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@app': './src',
          '@modules': './modules',
        },
      },
    ],
    'react-native-worklets/plugin',
  ].filter(Boolean);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
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
