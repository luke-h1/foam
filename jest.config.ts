import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './src/test/setupFilesAfterEnv.ts',
  ],
  setupFiles: ['./src/test/setupTests.ts'],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/src/test/__mocks__/svgMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  verbose: true,
  testEnvironment: 'jsdom',
});
