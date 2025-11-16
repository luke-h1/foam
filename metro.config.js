const { getDefaultConfig } = require('@expo/metro-config');
const { withRozenite } = require('@rozenite/metro');
const withStorybook = require('@storybook/react-native/metro/withStorybook');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// This helps support certain popular third-party libraries
// such as Firebase that use the extension cjs.
config.resolver.sourceExts.push('cjs');

const configWithStorybook = withStorybook(config);

module.exports = withRozenite(configWithStorybook, {
  enabled: process.env.WITH_ROZENITE === 'true', // Required: Rozenite is disabled by default
});
