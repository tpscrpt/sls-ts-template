module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: '.coverage',
  collectCoverage: false,
  coverageReporters: ['lcov'],
  collectCoverageFrom: ['src/functions/**/*.{ts,js}', '!**/node_modules/**'],
  moduleNameMapper: {
    '@functions/(.*)': '<rootDir>/src/functions/$1',
  },
  roots: ['<rootDir>'],
  testPathIgnorePatterns: ["node_modules", ".js"],
  globalSetup: process.env.TEST_INTEGRATION ? './__tests__/integration/setup.js' : undefined,
  globalTeardown: process.env.TEST_INTEGRATION ? './__tests__/integration/teardown.js' : undefined,
};
