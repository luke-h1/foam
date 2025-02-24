const jestConfig = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./test/setupTests.ts'],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|newrelic-react-native-agent)',
  ],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/src/test/__mocks__/svgMock.js',
    '^@app/(.*)$': '<rootDir>/src/$1',
    '\\.otf$': '<rootDir>/test/__mocks__/fileMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      lines: 60, // TODO: increase this to 70%
    },
  },
};
module.exports = jestConfig;
