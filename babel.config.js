module.exports = api => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      'transform-inline-environment-variables',
      // ORDER MATTERS - this must be always at the end
      'react-native-reanimated/plugin',
    ],
  };
};
