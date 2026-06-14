/* eslint-disable @typescript-eslint/no-require-imports */
const { createRunOncePlugin, withPodfile } = require('@expo/config-plugins');

const MARKER = '# >>> with-static-framework-modulemap-fix';
const END_MARKER = '# <<< with-static-framework-modulemap-fix';

const REACT_NATIVE_POST_INSTALL_BLOCK = `    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;

// Fixes clean-archive "no such module" failures with `useFrameworks: static` +
// `usePrecompiledModules: false` (Expo SDK 56 / RN 0.85 / Xcode 26).
//
// Pods built as static libraries (Expo, ExpoModulesCore, and — via
// forceStaticLinking — FirebaseCore and most of the Firebase chain) expose their
// Swift-importable module via a generated module map. The app's xcconfig
// references it at the build-products path
// `${PODS_CONFIGURATION_BUILD_DIR}/<Pod>/<Pod>.modulemap`, copied there by a
// CocoaPods script phase with no build-graph edge to the app target. On a clean
// archive (Xcode's separate BuildProductsPath) the app target compiles
// AppDelegate.swift / ExpoModulesProvider.swift before that copy exists, so
// `import Expo` / `import FirebaseCore` fail.
//
// Every such static-library pod also has the same module map at the stable,
// always-present pod-install path `${PODS_ROOT}/Headers/Public/<Pod>/<Pod>.modulemap`
// (the form Expo already uses for ReactAppDependencyProvider, which archives
// fine). This post_install hook repoints every build-products module-map
// reference to that stable path — but only when the stable file actually exists,
// so framework pods (no Headers/Public module map) are left untouched.
const SNIPPET = `
    ${MARKER}
    smf_headers_public = File.join(installer.sandbox.root.to_s, 'Headers', 'Public')
    smf_support_dir = File.join(installer.sandbox.root.to_s, 'Target Support Files')
    smf_replacements = {}
    Dir.glob(File.join(smf_headers_public, '*', '*.modulemap')).each do |smf_stable|
      smf_rel = smf_stable.sub(smf_headers_public + '/', '')
      smf_replacements['\${PODS_CONFIGURATION_BUILD_DIR}/' + smf_rel] = '\${PODS_ROOT}/Headers/Public/' + smf_rel
    end
    smf_patched = 0
    Dir.glob(File.join(smf_support_dir, '**', '*.xcconfig')).each do |smf_xcconfig|
      smf_before = File.read(smf_xcconfig)
      smf_after = smf_before.dup
      smf_replacements.each { |smf_from, smf_to| smf_after = smf_after.gsub(smf_from, smf_to) }
      next if smf_after == smf_before
      File.write(smf_xcconfig, smf_after)
      smf_patched += 1
    end
    puts "[static-framework-modulemap-fix] repointed module maps in #{smf_patched} xcconfig(s)" if smf_patched > 0
    ${END_MARKER}`;

const withStaticFrameworkModulemapFix = config =>
  withPodfile(config, configWithPodfile => {
    const contents = configWithPodfile.modResults.contents;

    if (contents.includes(MARKER)) {
      return configWithPodfile;
    }

    if (!contents.includes(REACT_NATIVE_POST_INSTALL_BLOCK)) {
      throw new Error(
        'withStaticFrameworkModulemapFix: could not find react_native_post_install in ios/Podfile',
      );
    }

    configWithPodfile.modResults.contents = contents.replace(
      REACT_NATIVE_POST_INSTALL_BLOCK,
      `${REACT_NATIVE_POST_INSTALL_BLOCK}${SNIPPET}`,
    );

    return configWithPodfile;
  });

module.exports = createRunOncePlugin(
  withStaticFrameworkModulemapFix,
  'static-framework-modulemap-fix',
  '1.0.0',
);
