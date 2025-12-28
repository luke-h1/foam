const { withRozenite } = require('@rozenite/metro');
const withStorybook = require('@storybook/react-native/metro/withStorybook');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// This helps support certain popular third-party libraries
// such as Firebase that use the extension cjs.
config.resolver.sourceExts.push('cjs');

config.transformer = {
  ...config.transformer,
  inlineRequires: true,
};

const configWithStorybook = withStorybook(config, {
  enabled:
    process.env.EXPO_PUBLIC_WITH_STORYBOOK === 'true' ||
    process.env.APP_VARIANT === 'preview',
});

module.exports = withRozenite(configWithStorybook, {
  enabled: process.env.EXPO_PUBLIC_WITH_ROZENITE === 'true',
});
