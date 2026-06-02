/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
} = require('@expo/config-plugins');

const CONFIG_CHANGES = [
  'orientation',
  'keyboardHidden',
  'keyboard',
  'screenSize',
  'smallestScreenSize',
  'locale',
  'layoutDirection',
  'fontScale',
  'screenLayout',
  'density',
  'uiMode',
].join('|');

const withAndroidMainActivityConfigChanges = config =>
  withAndroidManifest(config, configWithManifest => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(
      configWithManifest.modResults,
    );

    mainActivity.$['android:configChanges'] = CONFIG_CHANGES;
    mainActivity.$['android:hardwareAccelerated'] = 'true';

    return configWithManifest;
  });

module.exports = createRunOncePlugin(
  withAndroidMainActivityConfigChanges,
  'android-main-activity-config-changes',
  '1.0.0',
);
