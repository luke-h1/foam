/* eslint-disable @typescript-eslint/no-require-imports */
const { createRunOncePlugin, withPodfile } = require('@expo/config-plugins');

const BUILD_SETTING_SNIPPET = `
    if podfile_properties['ios.useFrameworks'] == 'static' || ENV['USE_FRAMEWORKS'] == 'static'
      installer.pods_project.targets.each do |target|
        target.build_configurations.each do |build_configuration|
          build_configuration.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end`;

const REACT_NATIVE_POST_INSTALL_BLOCK = `    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;

const withIosStaticFrameworkHeaderFix = config =>
  withPodfile(config, configWithPodfile => {
    const contents = configWithPodfile.modResults.contents;

    if (
      contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES') ||
      !contents.includes(REACT_NATIVE_POST_INSTALL_BLOCK)
    ) {
      return configWithPodfile;
    }

    configWithPodfile.modResults.contents = contents.replace(
      REACT_NATIVE_POST_INSTALL_BLOCK,
      `${REACT_NATIVE_POST_INSTALL_BLOCK}${BUILD_SETTING_SNIPPET}`,
    );

    return configWithPodfile;
  });

module.exports = createRunOncePlugin(
  withIosStaticFrameworkHeaderFix,
  'ios-static-framework-header-fix',
  '1.0.0',
);
