module.exports = api => {
  api.cache(true);

  const plugins = [
    [
      'react-native-unistyles/plugin',
      {
        root: 'src',
      },
    ],
  ];

  return {
    presets: ['babel-preset-expo'],
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
