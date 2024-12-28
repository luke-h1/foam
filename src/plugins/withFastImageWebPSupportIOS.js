/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const {
  WarningAggregator,
  withAppDelegate,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const RNFI_EXPO_WEBP_IMPORT = `#import "AppDelegate.h"
// expo-config-plugin fast-image webp animated support
#import "SDImageCodersManager.h"
#import <SDWebImageWebPCoder/SDImageWebPCoder.h>
// end config plugin
`;

const RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_IDENTIFIER = `- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{`;

const RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_CODE = `
  // start expo-config-plugin fast-image webp animated support
  [SDImageCodersManager.sharedManager addCoder: SDImageWebPCoder.sharedCoder];
  // end expo-config-plugin fast-image webp animated support
`;

function modifyAppDelegate(appDelegate) {
  if (!appDelegate.includes(RNFI_EXPO_WEBP_IMPORT)) {
    appDelegate = appDelegate.replace(
      /#import "AppDelegate.h"/g,
      RNFI_EXPO_WEBP_IMPORT,
    );
  }
  if (appDelegate.includes(RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_IDENTIFIER)) {
    if (!appDelegate.includes(RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_CODE)) {
      const block =
        RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_IDENTIFIER +
        RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_CODE;
      appDelegate = appDelegate.replace(
        RNFI_EXPO_WEBP_DID_FINISH_LAUNCHING_IDENTIFIER,
        block,
      );
    } else {
      WarningAggregator.addWarningIOS(
        'withFastImageWebPSupportIOSAppDelegate',
        `FastImage webP support already setup in AppDelegate`,
      );
    }
  } else {
    throw new Error(
      'Failed to detect didFinishLaunchingWithOptions in AppDelegate',
    );
  }
  return appDelegate;
}

const withFastImageWebPSupportIOS = config => {
  return withAppDelegate(config, config => {
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      config.modResults.contents = modifyAppDelegate(
        config.modResults.contents,
      );
    } else {
      WarningAggregator.addWarningIOS(
        'withFastImageWebPSupportIOSAppDelegate',
        `Cannot setup FastImage webP support, the project AppDelegate is not a supported language: ${config.modResults.language}`,
      );
    }
    return config;
  });
};

module.exports = createRunOncePlugin(
  withFastImageWebPSupportIOS,
  'rnfi-expo-animated-webp-support',
  '1.0.0',
);
