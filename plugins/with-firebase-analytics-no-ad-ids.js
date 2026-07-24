/* eslint-disable @typescript-eslint/no-require-imports */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// RNFBAnalytics.podspec installs FirebaseAnalytics/IdentitySupport (IDFA
// collection) unless $RNFirebaseAnalyticsWithoutAdIdSupport is set in the
// Podfile. We don't use advertising ids on either platform (Android blocks the
// AD_ID permission via blockedPermissions), so pin the ad-id-free subspec.
const FLAG = '$RNFirebaseAnalyticsWithoutAdIdSupport = true';

const withFirebaseAnalyticsNoAdIds = config =>
  withDangerousMod(config, [
    'ios',
    cfg => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        'Podfile',
      );
      const podfile = fs.readFileSync(podfilePath, 'utf8');
      if (!podfile.includes(FLAG)) {
        fs.writeFileSync(podfilePath, `${FLAG}\n${podfile}`);
      }
      return cfg;
    },
  ]);

module.exports = withFirebaseAnalyticsNoAdIds;
