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
    // TRIAL: react-native-boost strips RN View's JS wrapper to the host node
    // at build time. Text is disabled (foam's Text wrapper spreads {...props}
    // so boost bails anyway). Flip verbose:true + rebuild --clear to log every
    // optimize/skip; silent in jest, where the runtime falls back to plain View.
    [
      'react-native-boost/plugin',
      {
        optimizations: { text: false, view: true },
        ignores: ['node_modules/**'],
        verbose: false,
        silent: isTest,
      },
    ],
    [
      'react-native-worklets/plugin',
      {
        strictGlobal: true,
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
