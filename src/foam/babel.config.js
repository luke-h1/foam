module.exports = api => {
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = process.env.NODE_ENV === 'test';

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
    [
      'react-native-worklets/plugin',
      {
        strictGlobal: true,
      },
    ],
    [
      'react-native-boost/plugin',
      {
        optimizations: { text: false, view: true },
        ignores: ['node_modules/**'],
        verbose: false,
        silent: isTest,
      },
    ],
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
