// eslint-disable-next-line no-restricted-syntax
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jest-environment-node',
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
  transform: {}
};