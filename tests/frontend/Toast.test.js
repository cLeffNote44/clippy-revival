import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast, { useToastStore } from '../../src/components/Toast';

// Test component that uses the toast store
const ToastTester = () => {
  const { showToast, showSuccess, showError, showWarning, showInfo } = useToastStore();

  return (
    <div>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showWarning('Warning message')}>Show Warning</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
      <button onClick={() => showToast('Custom message', 'success', 'Custom Title', 3000)}>
        Show Custom
      </button>
    </div>
  );
};

describe('Toast Component', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    act(() => {
      useToastStore.getState().toasts = [];
    });
  });

  test('renders without crashing', () => {
    render(<Toast />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('displays success toast when showSuccess is called', async () => {
    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    const button = screen.getByRole('button', { name: /show success/i });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  test('displays error toast when showError is called', async () => {
    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    const button = screen.getByRole('button', { name: /show error/i });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  test('displays warning toast when showWarning is called', async () => {
    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    const button = screen.getByRole('button', { name: /show warning/i });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  test('displays info toast when showInfo is called', async () => {
    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    const button = screen.getByRole('button', { name: /show info/i });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  test('displays toast with custom title', async () => {
    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    const button = screen.getByRole('button', { name: /show custom/i });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  test('can display multiple toasts at once', async () => {
    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    act(() => {
      screen.getByRole('button', { name: /show success/i }).click();
      screen.getByRole('button', { name: /show error/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  test('toasts auto-dismiss after duration', async () => {
    jest.useFakeTimers();

    render(
      <>
        <Toast />
        <ToastTester />
      </>
    );

    act(() => {
      screen.getByRole('button', { name: /show custom/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    // Fast-forward time past the 3000ms duration
    act(() => {
      jest.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.queryByText('Custom message')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('removeToast removes specific toast', async () => {
    const TestComponent = () => {
      const { toasts, removeToast } = useToastStore();

      React.useEffect(() => {
        useToastStore.getState().showSuccess('Toast 1');
        useToastStore.getState().showSuccess('Toast 2');
      }, []);

      return (
        <div>
          {toasts.map((toast) => (
            <div key={toast.id}>
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}>Remove</button>
            </div>
          ))}
        </div>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    act(() => {
      removeButtons[0].click();
    });

    await waitFor(() => {
      expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });
  });

  test('clearAll removes all toasts', async () => {
    const TestComponent = () => {
      const { toasts, clearAll } = useToastStore();

      React.useEffect(() => {
        useToastStore.getState().showSuccess('Toast 1');
        useToastStore.getState().showError('Toast 2');
        useToastStore.getState().showWarning('Toast 3');
      }, []);

      return (
        <div>
          <div data-testid="toast-count">{toasts.length}</div>
          <button onClick={clearAll}>Clear All</button>
        </div>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    });

    act(() => {
      screen.getByRole('button', { name: /clear all/i }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  test('toasts have unique IDs', async () => {
    const ids = new Set();

    act(() => {
      for (let i = 0; i < 10; i++) {
        const state = useToastStore.getState();
        state.showSuccess(`Message ${i}`);
      }
    });

    const toasts = useToastStore.getState().toasts;
    toasts.forEach((toast) => {
      expect(ids.has(toast.id)).toBe(false);
      ids.add(toast.id);
    });

    expect(ids.size).toBe(10);
  });

  test('stores toast severity correctly', async () => {
    act(() => {
      useToastStore.getState().showSuccess('Success');
      useToastStore.getState().showError('Error');
      useToastStore.getState().showWarning('Warning');
      useToastStore.getState().showInfo('Info');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts[0].severity).toBe('success');
    expect(toasts[1].severity).toBe('error');
    expect(toasts[2].severity).toBe('warning');
    expect(toasts[3].severity).toBe('info');
  });

  test('uses default duration when not specified', async () => {
    act(() => {
      useToastStore.getState().showSuccess('Test');
    });

    const toast = useToastStore.getState().toasts[0];
    expect(toast.duration).toBe(6000); // Default 6 seconds
  });

  test('allows custom duration', async () => {
    act(() => {
      useToastStore.getState().showToast('Test', 'info', null, 10000);
    });

    const toast = useToastStore.getState().toasts[0];
    expect(toast.duration).toBe(10000);
  });
});
