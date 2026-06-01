/* eslint-disable @typescript-eslint/no-require-imports */
const { createRunOncePlugin, withPodfile } = require('@expo/config-plugins');

const MARKER = '# >>> with-pod-deployment-target';
const END_MARKER = '# <<< with-pod-deployment-target';
const LEGACY_SNIPPET_PATTERN =
  /\n {4}expo_modules_deployment_target = Gem::Version\.new\('[^']+'\)\n {4}installer\.pods_project\.targets\.each do \|target\|\n {6}target\.build_configurations\.each do \|build_configuration\|\n {8}deployment_target = build_configuration\.build_settings\['IPHONEOS_DEPLOYMENT_TARGET'\]\n {8}next unless deployment_target\n\n {8}if Gem::Version\.new\(deployment_target\) < expo_modules_deployment_target\n {10}build_configuration\.build_settings\['IPHONEOS_DEPLOYMENT_TARGET'\] = expo_modules_deployment_target\.to_s\n\s* {8}end\n {6}end\n {4}end\n/g;
const REACT_NATIVE_POST_INSTALL_BLOCK = `    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;

function buildSnippet(minIosVersion) {
  return [
    `    ${MARKER}`,
    `    expo_modules_deployment_target = Gem::Version.new('${minIosVersion}')`,
    `    installer.pods_project.targets.each do |target|`,
    `      target.build_configurations.each do |build_configuration|`,
    `        deployment_target = build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']`,
    `        next unless deployment_target`,
    ``,
    `        if Gem::Version.new(deployment_target) < expo_modules_deployment_target`,
    `          build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = expo_modules_deployment_target.to_s`,
    `        end`,
    `      end`,
    `    end`,
    `    ${END_MARKER}`,
  ].join('\n');
}

function injectIntoPodfile(contents, minIosVersion) {
  const markerPattern = new RegExp(
    `\\n[ \\t]*${MARKER}[\\s\\S]*?${END_MARKER}\\n?`,
    'm',
  );
  const contentsWithoutExistingSnippet = contents
    .replace(markerPattern, '\n')
    .replace(LEGACY_SNIPPET_PATTERN, '\n');

  if (contents.includes(MARKER)) {
    return contentsWithoutExistingSnippet.replace(
      REACT_NATIVE_POST_INSTALL_BLOCK,
      `${REACT_NATIVE_POST_INSTALL_BLOCK}\n\n${buildSnippet(minIosVersion)}`,
    );
  }

  if (!contents.includes(REACT_NATIVE_POST_INSTALL_BLOCK)) {
    throw new Error(
      'withPodDeploymentTarget: could not find react_native_post_install in ios/Podfile',
    );
  }

  return contentsWithoutExistingSnippet.replace(
    REACT_NATIVE_POST_INSTALL_BLOCK,
    `${REACT_NATIVE_POST_INSTALL_BLOCK}\n\n${buildSnippet(minIosVersion)}`,
  );
}

const withPodDeploymentTarget = (config, props = {}) =>
  withPodfile(config, configWithPodfile => {
    const minIosVersion = props.minIosVersion || '16.4';
    const contents = configWithPodfile.modResults.contents;

    configWithPodfile.modResults.contents = injectIntoPodfile(
      contents,
      minIosVersion,
    );

    return configWithPodfile;
  });

module.exports = createRunOncePlugin(
  withPodDeploymentTarget,
  'pod-deployment-target',
  '1.0.0',
);
