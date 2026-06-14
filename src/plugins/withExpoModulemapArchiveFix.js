/* eslint-disable @typescript-eslint/no-require-imports */
const { createRunOncePlugin, withPodfile } = require('@expo/config-plugins');

const MARKER = '# >>> with-expo-modulemap-archive-fix';

const REACT_NATIVE_POST_INSTALL_BLOCK = `    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;

// Fixes a clean-archive failure with `useFrameworks: static` +
// `usePrecompiledModules: false` (Expo SDK 56 / RN 0.85 / Xcode 26):
//
//   module map file '.../Release-iphoneos/Expo/Expo.modulemap' not found
//   module map file '.../Release-iphoneos/ExpoModulesCore/ExpoModulesCore.modulemap' not found
//   no such module 'Expo'   (Compiling AppDelegate.swift / ExpoModulesProvider.swift)
//
// Expo and ExpoModulesCore are built as static libraries, and the generated
// xcconfigs reference their module maps via the build-products path
// `${PODS_CONFIGURATION_BUILD_DIR}/<Pod>/<Pod>.modulemap`. That copy is produced
// by a CocoaPods script phase with no build-graph edge to the app target, so a
// clean archive (Xcode's separate BuildProductsPath) compiles the app target's
// Swift before the copy runs and cannot resolve `import Expo`.
//
// Expo already rewrites the React module-map references to a stable source path
// for use_frameworks! compatibility (e.g. React-use-frameworks.modulemap,
// ReactAppDependencyProvider) but does not apply the same rewrite to the Expo
// modules themselves. This post_install hook closes that gap by repointing the
// two Expo references to the always-present pod-install source path
// `${PODS_ROOT}/Headers/Public/<Pod>/<Pod>.modulemap` — the same form Expo uses
// for ReactAppDependencyProvider, which archives without error. The umbrella
// header sits next to that module map, so module resolution is unaffected.
//
// Remove once Expo's use_frameworks! patch covers the Expo modules upstream.
const SNIPPET = `
    ${MARKER}
    expo_modulemap_fix = {
      '\${PODS_CONFIGURATION_BUILD_DIR}/Expo/Expo.modulemap' => '\${PODS_ROOT}/Headers/Public/Expo/Expo.modulemap',
      '\${PODS_CONFIGURATION_BUILD_DIR}/ExpoModulesCore/ExpoModulesCore.modulemap' => '\${PODS_ROOT}/Headers/Public/ExpoModulesCore/ExpoModulesCore.modulemap',
    }
    expo_modulemap_support_dir = File.join(installer.sandbox.root.to_s, 'Target Support Files')
    expo_modulemap_patched = 0
    Dir.glob(File.join(expo_modulemap_support_dir, '**', '*.xcconfig')).each do |expo_xcconfig|
      expo_before = File.read(expo_xcconfig)
      expo_after = expo_before.dup
      expo_modulemap_fix.each { |expo_from, expo_to| expo_after = expo_after.gsub(expo_from, expo_to) }
      next if expo_after == expo_before
      File.write(expo_xcconfig, expo_after)
      expo_modulemap_patched += 1
    end
    puts "[expo-modulemap-archive-fix] repointed Expo module maps in #{expo_modulemap_patched} xcconfig(s)" if expo_modulemap_patched > 0
    # <<< with-expo-modulemap-archive-fix`;

const withExpoModulemapArchiveFix = config =>
  withPodfile(config, configWithPodfile => {
    const contents = configWithPodfile.modResults.contents;

    if (contents.includes(MARKER)) {
      return configWithPodfile;
    }

    if (!contents.includes(REACT_NATIVE_POST_INSTALL_BLOCK)) {
      throw new Error(
        'withExpoModulemapArchiveFix: could not find react_native_post_install in ios/Podfile',
      );
    }

    configWithPodfile.modResults.contents = contents.replace(
      REACT_NATIVE_POST_INSTALL_BLOCK,
      `${REACT_NATIVE_POST_INSTALL_BLOCK}${SNIPPET}`,
    );

    return configWithPodfile;
  });

module.exports = createRunOncePlugin(
  withExpoModulemapArchiveFix,
  'expo-modulemap-archive-fix',
  '1.0.0',
);
