/**
 * Keep the runtime the same when a release only bumps the version, so OTA
 * updates reach every build that shares the same native code.
 *
 * - `ExpoConfigVersions` skips `version` and the build numbers.
 * - `ExpoConfigExtraSection` skips `extra`. `EXPO_PUBLIC_SENTRY_RELEASE` in
 *   `extra` falls back to the version. An OTA update ships its own `extra`.
 * - `PackageJsonAndroidAndIosScriptsIfNotContainRun` is the Expo default.
 *   Setting `sourceSkips` replaces the default, so it is listed again here.
 *
 * `app-icon-badge` writes the version onto the non-production icons, and its
 * options hold the version text. A new icon cannot ship in an OTA update, so
 * the generated icons and the plugin options are left out of the hash.
 *
 * @type {import('expo/fingerprint').Config}
 */
const config = {
  sourceSkips: [
    'ExpoConfigVersions',
    'ExpoConfigExtraSection',
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
  ],
  ignorePaths: ['.expo/app-icon-badge/**'],
  fileHookTransform: (source, chunk) => {
    if (source.type !== 'contents' || source.id !== 'expoConfig' || !chunk) {
      return chunk;
    }

    const expoConfig = JSON.parse(chunk.toString());

    expoConfig.plugins = expoConfig.plugins?.map(plugin =>
      Array.isArray(plugin) && plugin[0] === 'app-icon-badge'
        ? 'app-icon-badge'
        : plugin,
    );

    return JSON.stringify(expoConfig);
  },
};

module.exports = config;
