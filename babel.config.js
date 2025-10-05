module.exports = api => {
  api.cache(true);

  const plugins = [
    [
      'react-native-unistyles/plugin',
      {
        root: 'src',
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
