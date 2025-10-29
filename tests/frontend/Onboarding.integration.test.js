import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Onboarding from '../../src/pages/Onboarding';
import { useToastStore } from '../../src/components/Toast';
import * as errorHandler from '../../src/services/errorHandler';

// Mock dependencies
jest.mock('../../src/components/Toast', () => ({
  useToastStore: jest.fn()
}));

jest.mock('../../src/services/errorHandler', () => ({
  checkBackendConnection: jest.fn()
}));

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Onboarding Integration Tests', () => {
  let mockShowToast;
  let mockGetBackendUrl;
  let mockFetch;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock toast store
    mockShowToast = jest.fn();
    useToastStore.mockReturnValue({
      showToast: mockShowToast
    });

    // Mock electronAPI
    mockGetBackendUrl = jest.fn(() => Promise.resolve('http://localhost:43110'));
    window.electronAPI = {
      ...window.electronAPI,
      getBackendUrl: mockGetBackendUrl
    };

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial render', () => {
    test('renders Welcome step by default', () => {
      renderWithRouter(<Onboarding />);

      expect(screen.getByText(/Welcome to Clippy Revival/i)).toBeInTheDocument();
      expect(screen.getByText(/AI-Powered Assistance/i)).toBeInTheDocument();
      expect(screen.getByText(/System Monitoring/i)).toBeInTheDocument();
    });

    test('displays all stepper steps', () => {
      renderWithRouter(<Onboarding />);

      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('System Check')).toBeInTheDocument();
      expect(screen.getByText('AI Setup')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    test('Back button is disabled on first step', () => {
      renderWithRouter(<Onboarding />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });

    test('Next button is enabled on first step', () => {
      renderWithRouter(<Onboarding />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeEnabled();
    });

    test('Skip button is visible on first step', () => {
      renderWithRouter(<Onboarding />);

      const skipButton = screen.getByRole('button', { name: /skip setup/i });
      expect(skipButton).toBeEnabled();
    });
  });

  describe('Navigation through steps', () => {
    test('advances to System Check when Next is clicked', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      const nextButton = screen.getByRole('button', { name: /next/i });

      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('System Check')).toBeInTheDocument();
        expect(screen.getByText(/We're checking if everything is ready/i)).toBeInTheDocument();
      });
    });

    test('can go back from System Check to Welcome', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('System Check')).toBeInTheDocument();
      });

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i });
      await act(async () => {
        fireEvent.click(backButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Clippy Revival/i)).toBeInTheDocument();
      });
    });

    test('proceeds through all steps to completion', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: ['llama3.2'] })
      });

      const onComplete = jest.fn();
      renderWithRouter(<Onboarding onComplete={onComplete} />);

      // Step 1 -> 2
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('System Check')).toBeInTheDocument();
      });

      // Wait for checks to complete
      await waitFor(() => {
        expect(screen.getByText(/Backend is running/i)).toBeInTheDocument();
      });

      // Step 2 -> 3
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('AI Setup')).toBeInTheDocument();
      });

      // Step 3 -> 4
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/You're All Set!/i)).toBeInTheDocument();
      });

      // Complete onboarding
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /get started/i }));
      });

      expect(onComplete).toHaveBeenCalled();
      expect(localStorage.getItem('onboardingCompleted')).toBe('true');
    });
  });

  describe('System Check step', () => {
    test('runs system checks automatically when entering step', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: ['llama3.2'] })
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(errorHandler.checkBackendConnection).toHaveBeenCalled();
      });
    });

    test('displays success when backend is running', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Backend is running/i)).toBeInTheDocument();
      });
    });

    test('displays success when Ollama is running', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Ollama is installed and running/i)).toBeInTheDocument();
      });
    });

    test('displays model count when models are available', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: ['llama3.2', 'codellama'] })
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/2 model\(s\) available/i)).toBeInTheDocument();
      });
    });

    test('displays warning when no models are installed', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/No models installed/i)).toBeInTheDocument();
        expect(screen.getByText(/No Models Installed/i)).toBeInTheDocument();
      });
    });

    test('displays error when Ollama is not running', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: false
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Ollama is not running/i)).toBeInTheDocument();
        expect(screen.getByText(/Ollama Not Found/i)).toBeInTheDocument();
      });
    });

    test('displays error when backend is not responding', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(false);

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Backend is not responding/i)).toBeInTheDocument();
      });
    });

    test('disables Next button when backend is not responding', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(false);

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Backend is not responding/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    test('allows proceeding even if Ollama is not running', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: false
      });

      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Ollama is not running/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeEnabled();
    });
  });

  describe('AI Setup step', () => {
    test('shows success message when Ollama is ready', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: ['llama3.2'] })
      });

      renderWithRouter(<Onboarding />);

      // Go to System Check
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Ollama is installed and running/i)).toBeInTheDocument();
      });

      // Go to AI Setup
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/You're all set!/i)).toBeInTheDocument();
      });
    });

    test('shows setup instructions when Ollama is not ready', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: false
      });

      renderWithRouter(<Onboarding />);

      // Go to System Check
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Ollama is not running/i)).toBeInTheDocument();
      });

      // Go to AI Setup
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/AI Setup Required/i)).toBeInTheDocument();
        expect(screen.getByText(/1. Install Ollama/i)).toBeInTheDocument();
        expect(screen.getByText(/2. Pull an AI Model/i)).toBeInTheDocument();
      });
    });
  });

  describe('Completion step', () => {
    test('shows completion message', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: ['llama3.2'] })
      });

      renderWithRouter(<Onboarding />);

      // Navigate to completion
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
        });
        await waitFor(() => Promise.resolve());
      }

      await waitFor(() => {
        expect(screen.getByText(/You're All Set!/i)).toBeInTheDocument();
        expect(screen.getByText(/Click "Get Started" to begin/i)).toBeInTheDocument();
      });
    });

    test('shows "Get Started" button on final step', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      // Navigate to completion
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
        });
        await waitFor(() => Promise.resolve());
      }

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /get started/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
      });
    });

    test('hides Skip button on final step', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      renderWithRouter(<Onboarding />);

      // Navigate to completion
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
        });
        await waitFor(() => Promise.resolve());
      }

      await waitFor(() => {
        const skipButton = screen.getByRole('button', { name: /skip setup/i });
        expect(skipButton).toBeDisabled();
      });
    });

    test('saves onboarding completion to localStorage', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      const onComplete = jest.fn();
      renderWithRouter(<Onboarding onComplete={onComplete} />);

      // Navigate to completion and click Get Started
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
        });
        await waitFor(() => Promise.resolve());
      }

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /get started/i }));
      });

      expect(localStorage.getItem('onboardingCompleted')).toBe('true');
    });

    test('calls onComplete callback when provided', async () => {
      errorHandler.checkBackendConnection.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] })
      });

      const onComplete = jest.fn();
      renderWithRouter(<Onboarding onComplete={onComplete} />);

      // Navigate to completion and finish
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
        });
        await waitFor(() => Promise.resolve());
      }

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /get started/i }));
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Skip functionality', () => {
    test('allows skipping onboarding from any step', async () => {
      const onComplete = jest.fn();
      renderWithRouter(<Onboarding onComplete={onComplete} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /skip setup/i }));
      });

      expect(localStorage.getItem('onboardingCompleted')).toBe('true');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('access setup from Settings later'),
        'info',
        'Onboarding Skipped'
      );
      expect(onComplete).toHaveBeenCalled();
    });

    test('shows toast notification when skipping', async () => {
      renderWithRouter(<Onboarding />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /skip setup/i }));
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'You can access setup from Settings later',
        'info',
        'Onboarding Skipped'
      );
    });
  });
});
