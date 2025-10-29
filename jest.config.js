module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/frontend', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx}',
    '**/*.test.{js,jsx}',
    '**/*.spec.{js,jsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config$': '<rootDir>/src/config.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/frontend/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/reportWebVitals.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    // Higher thresholds for critical files
    './src/components/ErrorBoundary.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/errorHandler.js': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './src/utils/storage.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@mui)/)'
  ],
  // Test timeout for async tests
  testTimeout: 10000,
  // Verbose output for better debugging
  verbose: false,
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks between tests
  restoreMocks: true
};