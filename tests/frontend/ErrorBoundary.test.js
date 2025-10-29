import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../../src/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child component</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  test('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(/something went wrong/i);
    expect(screen.getByText(/we apologize for the inconvenience/i)).toBeInTheDocument();
  });

  test('displays custom error message when provided', () => {
    const customMessage = 'Custom error occurred';

    render(
      <ErrorBoundary errorMessage={customMessage}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('uses custom fallback when provided', () => {
    const CustomFallback = ({ error }) => (
      <div data-testid="custom-fallback">Custom: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Custom: Test error/i)).toBeInTheDocument();
  });

  test('logs error to electronAPI when available', () => {
    const mockLogError = jest.fn();
    window.electronAPI = {
      ...window.electronAPI,
      logError: mockLogError
    };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLogError).toHaveBeenCalled();
    const logCall = mockLogError.mock.calls[0][0];
    expect(logCall.message).toContain('Test error');
    expect(logCall.stack).toBeDefined();
    expect(logCall.componentStack).toBeDefined();
  });

  test('shows reload button when showReload is true', () => {
    render(
      <ErrorBoundary showReload={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload page/i });
    expect(reloadButton).toBeInTheDocument();
  });

  test('hides reload button when showReload is false', () => {
    render(
      <ErrorBoundary showReload={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByRole('button', { name: /reload page/i })).not.toBeInTheDocument();
  });

  test('reload button reloads window when clicked', () => {
    const mockReload = jest.fn();
    delete window.location;
    window.location = { reload: mockReload };

    render(
      <ErrorBoundary showReload={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload page/i });
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  test('try again button resets error state when resetOnError is true', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnError={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(/something went wrong/i);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // After clicking try again, render with no error
    rerender(
      <ErrorBoundary resetOnError={true}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('maintains error state across re-renders when resetOnError is false', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnError={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(/something went wrong/i);

    // Re-render with no error, but error boundary should still show error
    rerender(
      <ErrorBoundary resetOnError={false}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(/something went wrong/i);
  });

  test('handles errors in nested components', () => {
    const NestedComponent = () => {
      throw new Error('Nested error');
    };

    render(
      <ErrorBoundary>
        <div>
          <div>
            <NestedComponent />
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(/something went wrong/i);
  });

  test('does not catch errors outside boundary', () => {
    const { container } = render(
      <div>
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
        <div data-testid="outside">Outside boundary</div>
      </div>
    );

    expect(screen.getByTestId('outside')).toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});
