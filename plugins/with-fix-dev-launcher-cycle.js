/* eslint-disable @typescript-eslint/no-require-imports */
const { withXcodeProject } = require('@expo/config-plugins');

// Workaround for https://github.com/expo/expo/issues/46204
//
// expo-dev-launcher@56.0.15 added an `inputPaths` entry to its
// "[Expo Dev Launcher] Strip Local Network Keys for Release" Run Script that
// references "$(TARGET_BUILD_DIR)/$(INFOPLIST_PATH)" with no matching
// `outputPaths`. When the app target embeds an app extension (e.g. the
// expo-sharing-extension appex), Xcode forms a dependency cycle through
// ProcessInfoPlistFile and Embed App Extensions and the build fails with:
//   "Cycle inside <target>; building could produce unreliable results."
//
// The fix is to clear the inputPaths declaration on that phase, reverting it
// to the pre-56.0.15 behavior. Setting alwaysOutOfDate does NOT break the
// cycle since the inputPaths edge remains in the dependency graph.
//
// Remove this plugin once expo-dev-launcher ships a release with a fix
// (declaring matching outputPaths, or moving the phase out of the
// dependency graph entirely).
const TARGET_PHASE_NAME =
  '[Expo Dev Launcher] Strip Local Network Keys for Release';

const withFixDevLauncherCycle = config =>
  withXcodeProject(config, cfg => {
    const phases =
      cfg.modResults.hash.project.objects.PBXShellScriptBuildPhase || {};

    for (const key of Object.keys(phases)) {
      const phase = phases[key];
      if (!phase || typeof phase !== 'object') {
        continue;
      }

      const name = (phase.name || '').replace(/^"|"$/g, '');
      if (name === TARGET_PHASE_NAME) {
        phase.inputPaths = [];
        phase.inputFileListPaths = [];
      }
    }

    return cfg;
  });

module.exports = withFixDevLauncherCycle;
