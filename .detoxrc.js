/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 300000,
    },
  },
  artifacts: {
    rootDir: 'artifacts/detox',
    plugins: {
      log: {
        enabled: true,
      },
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        takeWhen: {
          testDone: 'failing',
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      instruments: {
        enabled: false,
      },
    },
  },
  apps: {
    'ios.sim.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Foamdev.app',
      build:
        'APP_VARIANT=e2e xcodebuild ONLY_ACTIVE_ARCH=YES -workspace ios/Foamdev.xcworkspace -scheme Foamdev -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },
    'ios.sim.prebuilt': {
      type: 'ios.app',
      binaryPath:
        process.env.DETOX_APP_PATH ||
        'ios/build/Build/Products/Debug-iphonesimulator/Foamdev.app',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.sim.debug',
    },
    'ios.sim.prebuilt': {
      device: 'simulator',
      app: 'ios.sim.prebuilt',
    },
  },
};
