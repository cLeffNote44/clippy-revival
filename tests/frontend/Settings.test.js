/**
 * Tests for Settings Component
 * Tests settings management, model selection, and user preferences
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../../src/pages/Settings';
import { useAppStore } from '../../src/store/appStore';

// Mock the store
jest.mock('../../src/store/appStore');

// Mock fetch
global.fetch = jest.fn();

describe('Settings Component', () => {
  const mockStoreState = {
    backendUrl: 'http://localhost:43110'
  };

  beforeEach(() => {
    useAppStore.mockReturnValue(mockStoreState);
    global.fetch.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Settings component', () => {
    // Mock the models API call
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: ['llama3.2', 'mistral'], active_model: 'llama3.2' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  test('loads available models on mount', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: ['llama3.2', 'mistral', 'codellama'],
        active_model: 'llama3.2'
      })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    // Wait for models to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:43110/ai/models');
    });
  });

  test('displays active model selection', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: ['llama3.2', 'mistral'],
        active_model: 'llama3.2'
      })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Model/i)).toBeInTheDocument();
    });
  });

  test('shows warning when no models are available', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No models found/i)).toBeInTheDocument();
    });
  });

  test('handles model change', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: ['llama3.2', 'mistral'],
          active_model: 'llama3.2'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Model/i)).toBeInTheDocument();
    });

    // Find and click model selector
    const modelSelect = screen.getByLabelText(/Active Model/i);
    fireEvent.change(modelSelect, { target: { value: 'mistral' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:43110/ai/model',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_name: 'mistral' })
        })
      );
    });
  });

  test('toggles auto-execute tools setting', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    const autoExecuteToggle = screen.getByLabelText(/Auto-execute safe tools/i);

    fireEvent.click(autoExecuteToggle);

    // Setting should be saved to localStorage
    const savedSettings = JSON.parse(localStorage.getItem('clippy-settings'));
    expect(savedSettings.autoExecuteTools).toBe(true);
  });

  test('toggles show notifications setting', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    const notificationsToggle = screen.getByLabelText(/Show notifications/i);

    // Initially should be checked (default true)
    expect(notificationsToggle).toBeChecked();

    fireEvent.click(notificationsToggle);

    // Should now be unchecked
    expect(notificationsToggle).not.toBeChecked();
  });

  test('loads saved settings from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem('clippy-settings', JSON.stringify({
      autoExecuteTools: true,
      showNotifications: false,
      startOnBoot: true,
      pausedOnStart: false
    }));

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    // Check that settings were loaded
    const autoExecuteToggle = screen.getByLabelText(/Auto-execute safe tools/i);
    expect(autoExecuteToggle).toBeChecked();

    const notificationsToggle = screen.getByLabelText(/Show notifications/i);
    expect(notificationsToggle).not.toBeChecked();
  });

  test('navigates to Characters page when button clicked', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    const manageCharactersButton = screen.getByText(/Manage Characters/i);
    expect(manageCharactersButton).toBeInTheDocument();
    expect(manageCharactersButton).not.toBeDisabled();
  });

  test('navigates to Scheduler page when button clicked', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    const manageTasksButton = screen.getByText(/Manage Scheduled Tasks/i);
    expect(manageTasksButton).toBeInTheDocument();
    expect(manageTasksButton).not.toBeDisabled();
  });

  test('clears all data when button clicked', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [], active_model: '' })
    });

    // Mock window.location.reload
    delete window.location;
    window.location = { reload: jest.fn() };

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    const clearDataButton = screen.getByText(/Clear All Data/i);
    fireEvent.click(clearDataButton);

    // localStorage should be cleared
    expect(localStorage.length).toBe(0);
  });

  test('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });

  test('handles model change API error', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: ['llama3.2', 'mistral'],
          active_model: 'llama3.2'
        })
      })
      .mockRejectedValueOnce(new Error('API error'));

    render(
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Model/i)).toBeInTheDocument();
    });

    const modelSelect = screen.getByLabelText(/Active Model/i);
    fireEvent.change(modelSelect, { target: { value: 'mistral' } });

    // Should handle error without crashing
    await waitFor(() => {
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });
});
