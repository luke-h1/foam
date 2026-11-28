const {
  createRunOncePlugin,
  withAppBuildGradle,
  withGradleProperties,
  withSettingsGradle,
} = require('@expo/config-plugins');

const PROFILES_DIR = '../plugins/android-baseline-profile/profiles';
const BENCHMARK_DIR = '../plugins/android-baseline-profile/benchmark';

const profileGradle = `
// @generated begin foam-baseline-profile
android {
    sourceSets {
        main {
            if (findProperty('foam.baselineProfile') != 'false') {
                baselineProfiles.srcDir(new File(rootDir, '${PROFILES_DIR}'))
            }
        }
    }
}

dependencies {
    implementation 'androidx.profileinstaller:profileinstaller:1.4.1'
}
// @generated end foam-baseline-profile
`;

const benchmarkBuildTypeGradle = `
// @generated begin foam-benchmark
android {
    buildTypes {
        benchmark {
            initWith release
            signingConfig signingConfigs.debug
            matchingFallbacks = ['release']
            debuggable false
            profileable true
            if (findProperty('foam.benchmark.minify') == 'false') {
                minifyEnabled false
                shrinkResources false
            }
        }
    }
}
// @generated end foam-benchmark
`;

const benchmarkSettingsGradle = `
// @generated begin foam-benchmark
include ':benchmark'
project(':benchmark').projectDir = new File(rootDir, '${BENCHMARK_DIR}')
// @generated end foam-benchmark
`;

function appendOnce(contents, block) {
  const tag = block.match(/@generated begin (\S+)/)[1];

  return contents.includes(`@generated begin ${tag}`)
    ? contents
    : contents + block;
}

const withAndroidBaselineProfile = config => {
  const withBenchmark = process.env.FOAM_ANDROID_BENCHMARK === '1';

  const withProfile = withAppBuildGradle(config, configWithGradle => {
    const contents = appendOnce(
      configWithGradle.modResults.contents,
      profileGradle,
    );

    configWithGradle.modResults.contents = withBenchmark
      ? appendOnce(contents, benchmarkBuildTypeGradle)
      : contents;

    return configWithGradle;
  });

  if (!withBenchmark) {
    return withProfile;
  }

  const withSettings = withSettingsGradle(withProfile, configWithSettings => {
    configWithSettings.modResults.contents = appendOnce(
      configWithSettings.modResults.contents,
      benchmarkSettingsGradle,
    );

    return configWithSettings;
  });

  return withGradleProperties(withSettings, configWithProperties => {
    configWithProperties.modResults = configWithProperties.modResults.filter(
      item =>
        item.type !== 'property' || item.key !== 'foam.benchmark.targetPackage',
    );

    configWithProperties.modResults.push({
      type: 'property',
      key: 'foam.benchmark.targetPackage',
      value: config.android.package,
    });

    return configWithProperties;
  });
};

module.exports = createRunOncePlugin(
  withAndroidBaselineProfile,
  'android-baseline-profile',
  '2.0.0',
);
