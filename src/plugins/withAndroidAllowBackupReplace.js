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
    const { manifest } = configWithManifest.modResults;
    manifest.$ = {
      ...manifest.$,
      'xmlns:tools': 'http://schemas.android.com/tools',
    };

    const application = manifest.application?.[0];

    if (application) {
      const entries = (application.$['tools:replace'] ?? '')
        .split(',')
        .filter(Boolean);
      if (!entries.includes('android:allowBackup')) {
        entries.push('android:allowBackup');
      }
      application.$['tools:replace'] = entries.join(',');
    }

    return configWithManifest;
  });

module.exports = createRunOncePlugin(
  withAndroidAllowBackupReplace,
  'android-allow-backup-replace',
  '1.0.0',
);
