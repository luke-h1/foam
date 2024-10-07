const jestConfig = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  verbose: true,
  transformIgnorePatterns: [],
};
module.exports = jestConfig;
