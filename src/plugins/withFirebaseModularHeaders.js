/* eslint-disable @typescript-eslint/no-require-imports */
const { createRunOncePlugin, withPodfile } = require('@expo/config-plugins');

// Enables modular headers for the Firebase SDK pods while keeping the
// React-Native-Firebase bridge pods non-modular.
//
// Most of the Firebase chain is force-statically-linked (expo-build-properties
// forceStaticLinking) so each pod's module map lands at a stable
// ${PODS_ROOT}/Headers/Public path the app can import on a clean archive (see
// withStaticFrameworkModulemapFix). Once those pods are static libraries, the
// Swift Firebase pods that depend on them require them to "define modules"
// (CocoaPods only does that with modular headers), and FirebaseCore needs its
// own deps (FirebaseCoreInternal, GoogleUtilities) modular to see types like
// FIRHeartbeatController. So `use_modular_headers!` is enabled globally.
//
// But the RNFirebase bridge pods (RNFBApp, RNFBInstallations, ...) contain
// React-Native bridge ObjC (RCT_EXPORT_METHOD, RCTBridgeModule) that does not
// compile under strict modular headers:
//   'RCTBridgeModule' must be imported from module 'RNFBApp.RNFBAppModule' ...
// so they are explicitly opted back out with :modular_headers => false.
//
// Safe alongside CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES (set by
// withIosStaticFrameworkHeaderFix).
const ANCHOR = '  use_expo_modules!';
const RNFB_PODS = [
  'RNFBApp',
  'RNFBInstallations',
  'RNFBAnalytics',
  'RNFBRemoteConfig',
];
const INSERT = [
  '  use_expo_modules!',
  '  use_modular_headers!',
  ...RNFB_PODS.map(pod => `  pod '${pod}', :modular_headers => false`),
].join('\n');

const withFirebaseModularHeaders = config =>
  withPodfile(config, configWithPodfile => {
    const contents = configWithPodfile.modResults.contents;

    if (contents.includes('use_modular_headers!')) {
      return configWithPodfile;
    }

    if (!contents.includes(ANCHOR)) {
      throw new Error(
        'withFirebaseModularHeaders: could not find `use_expo_modules!` in ios/Podfile',
      );
    }

    configWithPodfile.modResults.contents = contents.replace(ANCHOR, INSERT);

    return configWithPodfile;
  });

module.exports = createRunOncePlugin(
  withFirebaseModularHeaders,
  'firebase-modular-headers',
  '1.0.0',
);
