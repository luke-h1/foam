const { withRozenite } = require('@rozenite/metro');
const {
  withRozeniteRequireProfiler,
} = require('@rozenite/require-profiler-plugin/metro');
const {
  withStorybook,
} = require('@storybook/react-native/metro/withStorybook');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

/**
 * @type {import('expo/metro-config').MetroConfig}
 */
// includeWebReplay: false stubs @sentry-internal/replay (~310KB minified) on
// every platform; the app never enables Sentry session replay.
const config = getSentryExpoConfig(__dirname, { includeWebReplay: false });

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const excludedRootDirs = ['player-website', 'build-artifacts'].map(
  dir => new RegExp(`${escapeRegExp(path.resolve(__dirname, dir))}[/\\\\].*`),
);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  ...excludedRootDirs,
];

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
    process.env.APP_VARIANT === 'internal',
});

module.exports = withRozenite(configWithStorybook, {
  enabled: process.env.EXPO_PUBLIC_WITH_ROZENITE === 'true',
  enhanceMetroConfig: config => withRozeniteRequireProfiler(config),
});
