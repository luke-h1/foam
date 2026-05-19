const jestConfig = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./test/setupTests.ts'],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/.*|native-base|react-native-svg|newrelic-react-native-agent)',
    'node_modules/.*storybook.*',
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '\\.otf$': '<rootDir>/__mocks__/fileMock.js',
    '^@bacons/apple-colors$': '<rootDir>/__mocks__/@bacons/apple-colors.ts',
    '^react-native-legal$': '<rootDir>/__mocks__/react-native-legal.ts',
    '^react-native-bootsplash$':
      '<rootDir>/__mocks__/react-native-bootsplash.ts',
    '^(\\./|\\.\\./)*\\.rnstorybook/storybook\\.requires(\\.(ts|tsx|js|jsx))?$':
      '<rootDir>/__mocks__/.rnstorybook/storybook.requires.tsx',
    '^(\\./|\\.\\./)*\\.rnstorybook/index(\\.(ts|tsx|js|jsx))?$':
      '<rootDir>/__mocks__/.rnstorybook/index.tsx',
    '^(\\./|\\.\\./)*\\.rnstorybook$':
      '<rootDir>/__mocks__/.rnstorybook/index.tsx',
    '^@app/screens/StorybookScreen$':
      '<rootDir>/__mocks__/src/screens/StorybookScreen.tsx',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: process.env.CI === 'true' || process.env.JEST_VERBOSE === 'true',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/test/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'scripts/workflows/chat-performance-comment.ts',
    'scripts/workflows/*-utils.ts',
    'scripts/workflows/github-actions.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/__snapshots__/**',
    '!src/test/**',
  ],
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Use 50% of available CPUs
  maxWorkers: Math.max(1, Math.floor(require('os').cpus().length * 0.5)),
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  moduleDirectories: ['node_modules', '<rootDir>'],
  collectCoverage: false,
  coverageThreshold: {
    global: {
      lines: 60, // TODO: increase this to 70%
    },
  },
};
module.exports = jestConfig;
