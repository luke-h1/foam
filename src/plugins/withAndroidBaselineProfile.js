/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createRunOncePlugin,
  withAppBuildGradle,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const PROFILE_INSTALLER = 'androidx.profileinstaller:profileinstaller:1.4.1';
const MARKER = '// foam: baseline profile installer';
const PROFILE_SOURCE = 'src/plugins/android/baseline-prof.txt';

// Installs the checked-in profile on builds that do not get a Play cloud
// profile (sideloads, internal track, `am start -W` measurements).
const withProfileInstallerDependency = config =>
  withAppBuildGradle(config, configWithGradle => {
    const { contents } = configWithGradle.modResults;
    if (!contents.includes(MARKER)) {
      configWithGradle.modResults.contents = `${contents}\n${MARKER}\ndependencies {\n    implementation("${PROFILE_INSTALLER}")\n}\n`;
    }
    return configWithGradle;
  });

// AGP compiles `app/src/main/baseline-prof.txt` into the APK or AAB; the
// android/ tree is generated, so the file is copied in on every prebuild.
const withBaselineProfileFile = config =>
  withDangerousMod(config, [
    'android',
    configWithMod => {
      const source = path.join(
        configWithMod.modRequest.projectRoot,
        PROFILE_SOURCE,
      );
      const target = path.join(
        configWithMod.modRequest.platformProjectRoot,
        'app/src/main/baseline-prof.txt',
      );
      fs.copyFileSync(source, target);
      return configWithMod;
    },
  ]);

const withAndroidBaselineProfile = config =>
  withBaselineProfileFile(withProfileInstallerDependency(config));

module.exports = createRunOncePlugin(
  withAndroidBaselineProfile,
  'android-baseline-profile',
  '1.0.0',
);
