/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createRunOncePlugin,
  withGradleProperties,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const LINT_DISABLE_BLOCK = `
subprojects { sub ->
  sub.plugins.withId('com.android.library') {
    sub.android {
      lint {
        checkReleaseBuilds false
        abortOnError false
      }
    }
  }
}`;

const withAndroidReleaseLintFix = config => {
  config = withGradleProperties(config, gradleConfig => {
    const props = gradleConfig.modResults;

    const idx = props.findIndex(
      p => p.type === 'property' && p.key === 'org.gradle.jvmargs',
    );

    const jvmArgs = {
      type: 'property',
      key: 'org.gradle.jvmargs',
      value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
    };

    if (idx >= 0) {
      props[idx] = jvmArgs;
    } else {
      props.push(jvmArgs);
    }

    return gradleConfig;
  });

  config = withProjectBuildGradle(config, gradleConfig => {
    if (
      gradleConfig.modResults.language === 'groovy' &&
      !gradleConfig.modResults.contents.includes('checkReleaseBuilds false')
    ) {
      gradleConfig.modResults.contents += LINT_DISABLE_BLOCK;
    }
    return gradleConfig;
  });

  return config;
};

module.exports = createRunOncePlugin(
  withAndroidReleaseLintFix,
  'android-release-lint-fix',
  '1.0.0',
);
