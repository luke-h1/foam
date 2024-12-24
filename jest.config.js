// eslint-disable-next-line @typescript-eslint/no-require-imports
const expoPreset = require('jest-expo/jest-preset');

const jestConfig = {
  ...expoPreset,
  // preset: 'react-native',
  preset: 'jest-expo',

  setupFilesAfterEnv: ['./test/setupTests.ts'],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/src/test/__mocks__/svgMock.js',
    '^@app/(.*)$': '<rootDir>/src/$1',
    '\\.otf$': '<rootDir>/test/__mocks__/fileMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testEnvironment: 'jsdom',
};
module.exports = jestConfig;
