const jestConfig = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./test/setupFilesAfterEnv.js'],
  setupFiles: ['./src/test/setupTests.ts'],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/src/test/__mocks__/svgMock.js',
    '^@app/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  verbose: true,
  testEnvironment: 'jsdom',
};
module.exports = jestConfig;
