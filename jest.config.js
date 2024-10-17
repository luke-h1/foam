const jestConfig = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./test/setupFilesAfterEnv.js'],
  setupFiles: [
    './test/setupTests.ts',
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/src/test/__mocks__/svgMock.js',
    '^@app/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  verbose: true,
  testEnvironment: 'jsdom',
};
module.exports = jestConfig;
