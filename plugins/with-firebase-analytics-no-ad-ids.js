/* eslint-disable @typescript-eslint/no-require-imports */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

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
