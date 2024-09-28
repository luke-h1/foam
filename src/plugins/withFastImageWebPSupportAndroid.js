/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
const { withAppBuildGradle } = require('@expo/config-plugins');

const withCustomAppBuildGradle = config => {
  const insertString = `implementation "com.github.zjupure:webpdecoder:2.0.4.12.0"`;
  return withAppBuildGradle(config, config => {
    if (config.modResults.contents.includes(insertString)) {
      return config;
    }

    config.modResults.contents = config.modResults.contents.replace(
      `if (isWebpAnimatedEnabled) {`,
      `if (isWebpAnimatedEnabled) {
            ${insertString}`,
    );
    return config;
  });
};

module.exports = function withFastImageWebPSupportAndroid(config) {
  config = withCustomAppBuildGradle(config);
  return config;
};
