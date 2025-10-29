# Testing Guide for Clippy Revival

This guide explains the testing strategy, tools, and best practices for the Clippy Revival project.

## Table of Contents

1. [Overview](#overview)
2. [Testing Stack](#testing-stack)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Organization](#test-organization)
6. [Code Coverage](#code-coverage)
7. [Best Practices](#best-practices)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

## Overview

The Clippy Revival project uses a comprehensive testing approach with three test layers:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test component interactions and user flows
- **E2E Tests**: Test complete user journeys in a browser environment

### Test Coverage Goals

- Global coverage: **60%** for all metrics (branches, functions, lines, statements)
- Critical files: **75-80%** coverage
  - ErrorBoundary: 80%
  - errorHandler: 75%
  - storage utility: 80%

## Testing Stack

### Frontend Testing

- **Jest** (v30.2.0): Test runner and assertion library
- **React Testing Library** (v16.3.0): Component testing utilities
- **@testing-library/jest-dom** (v6.9.1): Custom DOM matchers
- **@testing-library/user-event** (v14.6.1): User interaction simulation

### E2E Testing

- **Playwright** (v1.56.1): Cross-browser end-to-end testing
- **Multi-browser support**: Chromium, Firefox, WebKit, and Electron

### Backend Testing

- **pytest**: Python unit and integration tests (see `backend/tests/`)

## Running Tests

### All Tests

```bash
# Run all tests (frontend, backend, and E2E)
npm run test:all
```

### Frontend Unit Tests

```bash
# Run unit tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Backend Tests

```bash
# Run Python tests
npm run test:backend

# Or directly with pytest
cd backend && pytest tests/
```

### E2E Tests

```bash
# Run E2E tests headless
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui
```

## Writing Tests

### Unit Tests

Unit tests are located in `tests/frontend/` and follow this naming pattern: `ComponentName.test.js`

#### Component Test Example

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '../../src/components/MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('handles user interaction', () => {
    const onClick = jest.fn();
    render(<MyComponent onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Utility Function Test Example

```javascript
import { myUtilityFunction } from '../../src/utils/myUtility';

describe('myUtilityFunction', () => {
  test('returns expected result', () => {
    expect(myUtilityFunction('input')).toBe('expected output');
  });

  test('handles edge cases', () => {
    expect(myUtilityFunction(null)).toBe(null);
    expect(myUtilityFunction(undefined)).toBe(null);
  });
});
```

### Integration Tests

Integration tests test multiple components working together. They follow the pattern: `Feature.integration.test.js`

```javascript
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CompleteFeature from '../../src/pages/CompleteFeature';

describe('Complete Feature Integration', () => {
  test('completes user flow', async () => {
    render(
      <BrowserRouter>
        <CompleteFeature />
      </BrowserRouter>
    );

    // Step 1
    fireEvent.click(screen.getByRole('button', { name: /start/i }));

    // Step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    // Complete flow
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

E2E tests are located in `tests/e2e/` and follow the pattern: `feature.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
    await page.goto('/');
  });

  test('completes user journey', async ({ page }) => {
    // Navigate
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/dashboard/);

    // Interact
    await page.getByRole('button', { name: /action/i }).click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Test Organization

### Directory Structure

```
tests/
├── frontend/                    # Frontend unit and integration tests
│   ├── __mocks__/              # Mock files for assets
│   │   └── fileMock.js         # Image/asset mocks
│   ├── setupTests.js           # Global test setup
│   ├── infrastructure.test.js  # Testing infrastructure verification
│   ├── ErrorBoundary.test.js   # Component tests
│   ├── Toast.test.js
│   ├── LoadingSpinner.test.js
│   ├── SkeletonLoader.test.js
│   ├── storage.test.js         # Utility tests
│   ├── errorHandler.test.js
│   ├── keyboardShortcuts.test.js
│   ├── Onboarding.integration.test.js  # Integration tests
│   └── ChatInterface.test.js
├── e2e/                        # End-to-end tests
│   ├── dashboard.spec.js
│   ├── onboarding.spec.js
│   ├── navigation.spec.js
│   └── chat.spec.js
└── backend/                    # Backend tests (Python)
    ├── test_api.py
    └── test_services.py
```

### File Naming Conventions

- **Unit tests**: `ComponentName.test.js` or `utilityName.test.js`
- **Integration tests**: `Feature.integration.test.js`
- **E2E tests**: `feature.spec.js`
- **Mock files**: `__mocks__/moduleName.js`

## Code Coverage

### Viewing Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
# Open in browser
open coverage/lcov-report/index.html

# On Windows
start coverage/lcov-report/index.html

# On Linux
xdg-open coverage/lcov-report/index.html
```

### Coverage Reports

The following coverage reports are generated:

- **Text**: Console output during test run
- **HTML**: Interactive browsable report in `coverage/lcov-report/`
- **LCOV**: Machine-readable format for CI/CD tools
- **JSON**: Summary data for badges and analytics

### Coverage Thresholds

Tests will fail if coverage drops below these thresholds:

**Global (all files):**
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

**Critical files (higher thresholds):**
- `ErrorBoundary.js`: 80%
- `errorHandler.js`: 75%
- `storage.js`: 80%

### Excluded from Coverage

- `src/index.js` - Application entry point
- `src/**/*.test.{js,jsx}` - Test files
- `src/**/__tests__/**` - Test directories
- `src/reportWebVitals.js` - Performance metrics

## Best Practices

### 1. Test Behavior, Not Implementation

✅ **Good:**
```javascript
test('shows error message when login fails', async () => {
  render(<LoginForm />);

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

❌ **Bad:**
```javascript
test('sets error state to true', () => {
  const wrapper = shallow(<LoginForm />);
  wrapper.instance().setState({ error: true });
  expect(wrapper.state('error')).toBe(true);
});
```

### 2. Use Accessible Queries

Prefer queries in this order:

1. `getByRole` - Best for accessibility
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Input fallback
4. `getByText` - Content
5. `getByTestId` - Last resort

```javascript
// ✅ Good - uses accessible queries
const button = screen.getByRole('button', { name: /submit/i });
const input = screen.getByLabelText(/email/i);

// ❌ Avoid - relies on implementation details
const button = screen.getByClassName('submit-button');
const input = document.querySelector('#email-input');
```

### 3. Test User Interactions

```javascript
import userEvent from '@testing-library/user-event';

test('types in search box', async () => {
  const user = userEvent.setup();
  render(<SearchBox />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'search query');

  expect(input).toHaveValue('search query');
});
```

### 4. Wait for Async Operations

```javascript
import { waitFor } from '@testing-library/react';

test('loads data asynchronously', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### 5. Mock External Dependencies

```javascript
// Mock API calls
jest.mock('../../src/services/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test' }))
}));

// Mock electron API
beforeEach(() => {
  window.electronAPI = {
    getBackendUrl: jest.fn(() => Promise.resolve('http://localhost:43110'))
  };
});
```

### 6. Clean Up After Tests

```javascript
describe('Component with side effects', () => {
  beforeEach(() => {
    // Setup
    localStorage.clear();
  });

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  test('does something', () => {
    // Test code
  });
});
```

### 7. Test Error States

```javascript
test('handles API errors gracefully', async () => {
  // Mock API to fail
  global.fetch = jest.fn(() => Promise.reject(new Error('API Error')));

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
  });
});
```

### 8. Keep Tests Focused

Each test should verify one behavior:

✅ **Good:**
```javascript
test('shows validation error for empty email', () => {
  render(<LoginForm />);
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});

test('shows validation error for invalid email format', () => {
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'invalid' }
  });
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
});
```

❌ **Bad:**
```javascript
test('validates form', () => {
  // Tests too many things at once
  // Hard to debug when it fails
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

#### 1. Tests fail with "Cannot find module"

**Solution:** Check module path aliases in `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@components/(.*)$': '<rootDir>/src/components/$1'
}
```

#### 2. Async tests timeout

**Solution:** Increase timeout in jest.config.js or per-test:

```javascript
// Global
testTimeout: 10000

// Per test
test('async operation', async () => {
  // test code
}, 15000); // 15 second timeout
```

#### 3. MUI components fail to render

**Solution:** Ensure proper setup in `setupTests.js` and transform MUI in Jest config:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!(axios|@mui)/)'
]
```

#### 4. E2E tests fail in CI

**Solution:** Ensure Playwright browsers are installed:

```bash
npx playwright install --with-deps
```

#### 5. Coverage threshold fails unexpectedly

**Solution:** Run coverage locally to see which files need more tests:

```bash
npm run test:coverage
```

Check the HTML report to identify uncovered code paths.

### Debugging Tests

#### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--config",
    "jest.config.js"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

#### Debug E2E Tests

```bash
# Run Playwright in headed mode
npx playwright test --headed

# Run with browser dev tools
npx playwright test --debug

# Run specific test file
npx playwright test tests/e2e/onboarding.spec.js
```

#### Enable Verbose Output

```bash
# Jest verbose mode
npm test -- --verbose

# Playwright trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Additional Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm run test:all`
3. Verify coverage meets thresholds: `npm run test:coverage`
4. Add E2E tests for major user flows
5. Update this documentation if adding new test patterns

## Questions?

If you encounter issues or have questions about testing:

1. Check this guide first
2. Review existing test files for examples
3. Check the troubleshooting section
4. Open an issue on GitHub with the `testing` label
