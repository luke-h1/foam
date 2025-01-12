// Learn more https://docs.expo.io/guides/customizing-metro
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: true,
  },
});

config.resolver.extraNodeModules = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ...require('node-libs-react-native'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  net: require('node-libs-react-native/mock/net'),
  stream: require.resolve('readable-stream'),
};
// This helps support certain popular third-party libraries
// such as Firebase that use the extension cjs.
config.resolver.sourceExts.push('cjs');

module.exports = config;
