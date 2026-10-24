/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Expo SDK 58 starts React Native from SceneDelegate, so the
 * `@react-native-firebase/app` config plugin cannot find its old AppDelegate
 * anchors and skips `FirebaseApp.configure()`. Until upstream ships a fix we
 * land here, insert the call ourselves before the scene-lifecycle return.
 *
 * Delete this plugin once RNFB's AppDelegate mod matches the SDK 58 template.
 */
const { withAppDelegate } = require('@expo/config-plugins');

const ANCHOR =
  'return super.application(application, didFinishLaunchingWithOptions: launchOptions)';

function withFirebaseSceneConfigure(config) {
  return withAppDelegate(config, cfg => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error(
        'with-firebase-scene-configure expects the Swift AppDelegate from SDK 58.',
      );
    }

    let contents = cfg.modResults.contents;

    if (contents.includes('FirebaseApp.configure()')) {
      return cfg;
    }

    if (!contents.includes('import FirebaseCore')) {
      contents = contents.replace(
        /^(internal import Expo|import Expo)$/m,
        '$1\nimport FirebaseCore',
      );
    }

    if (!contents.includes(ANCHOR)) {
      throw new Error(
        'with-firebase-scene-configure: scene-lifecycle return not found in AppDelegate.swift.',
      );
    }

    cfg.modResults.contents = contents.replace(
      ANCHOR,
      `FirebaseApp.configure()\n\n    ${ANCHOR}`,
    );
    return cfg;
  });
}

module.exports = withFirebaseSceneConfigure;
