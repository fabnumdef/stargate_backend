module.exports = {
  testEnvironment: 'node',
  globalTeardown: './tests/teardown.js',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
