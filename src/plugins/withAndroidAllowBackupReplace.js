/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createRunOncePlugin,
  withAndroidManifest,
} = require('@expo/config-plugins');

/**
 * `android.allowBackup: false` fails the release manifest merge because
 * TAndroidLame (via react-native-compressor) declares allowBackup=true in its
 * library manifest; tools:replace lets the app value win.
 */
const withAndroidAllowBackupReplace = config =>
  withAndroidManifest(config, configWithManifest => {
    const application = configWithManifest.modResults.manifest.application?.[0];

    if (application) {
      const existing = application.$['tools:replace'];
      application.$['tools:replace'] = existing
        ? `${existing},android:allowBackup`
        : 'android:allowBackup';
    }

    return configWithManifest;
  });

module.exports = createRunOncePlugin(
  withAndroidAllowBackupReplace,
  'android-allow-backup-replace',
  '1.0.0',
);
