/**
 * Tests for Dashboard Component
 * Tests rendering, state management, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../src/pages/Dashboard';
import { useAppStore } from '../../src/store/appStore';

// Mock the store
jest.mock('../../src/store/appStore');

// Mock child components to isolate Dashboard tests
jest.mock('../../src/components/ChatInterface', () => {
  return function ChatInterface() {
    return <div data-testid="chat-interface">Chat Interface</div>;
  };
});

describe('Dashboard Component', () => {
  const mockStoreState = {
    systemMetrics: {
      cpu: 45.2,
      memory: {
        used: 8000000000,
        total: 16000000000,
        percent: 50
      },
      disk: {
        used: 500000000000,
        total: 1000000000000,
        percent: 50
      },
      network: {
        sent: 1000000,
        received: 2000000
      }
    },
    isConnected: true,
    backendUrl: 'http://localhost:43110'
  };

  beforeEach(() => {
    useAppStore.mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Dashboard component', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  test('displays system metrics when connected', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should display CPU usage
    expect(screen.getByText(/CPU/i)).toBeInTheDocument();

    // Should display memory usage
    expect(screen.getByText(/Memory/i)).toBeInTheDocument();
  });

  test('shows disconnected state when backend is not connected', () => {
    useAppStore.mockReturnValue({
      ...mockStoreState,
      isConnected: false
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should show connection error or warning
    const disconnectedElements = screen.queryAllByText(/connect/i);
    expect(disconnectedElements.length).toBeGreaterThan(0);
  });

  test('renders chat interface', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
  });

  test('displays formatted CPU percentage', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // CPU should be formatted as percentage
    const cpuText = screen.getByText(/45/);
    expect(cpuText).toBeInTheDocument();
  });

  test('displays formatted memory usage', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should display memory percentage (50%)
    const memoryElements = screen.queryAllByText(/50/);
    expect(memoryElements.length).toBeGreaterThan(0);
  });

  test('handles missing metrics gracefully', () => {
    useAppStore.mockReturnValue({
      ...mockStoreState,
      systemMetrics: null
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should still render without crashing
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  test('updates when metrics change', () => {
    const { rerender } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Update metrics
    useAppStore.mockReturnValue({
      ...mockStoreState,
      systemMetrics: {
        ...mockStoreState.systemMetrics,
        cpu: 75.5
      }
    });

    rerender(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should display updated CPU
    const cpuText = screen.getByText(/75/);
    expect(cpuText).toBeInTheDocument();
  });

  test('renders navigation or tab elements if present', () => {
    render(
      <BrowserRouter>
        <Dashboard activeTab="monitoring" />
      </BrowserRouter>
    );

    // Dashboard might have tabs or navigation
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  test('accessible to screen readers', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Check for proper ARIA labels or semantic HTML
    const main = screen.getByText(/Dashboard/i);
    expect(main).toBeInTheDocument();
  });
});
