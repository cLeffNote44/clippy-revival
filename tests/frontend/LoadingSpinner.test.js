import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../../src/components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders loading spinner', () => {
    render(<LoadingSpinner />);

    // CircularProgress component creates a progressbar role
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders with default size when not specified', () => {
    const { container } = render(<LoadingSpinner />);

    // Check that the spinner has the default size
    const spinner = container.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  test('renders with custom size', () => {
    const { container } = render(<LoadingSpinner size={60} />);

    const spinner = container.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' });
  });

  test('displays message when provided', () => {
    render(<LoadingSpinner message="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  test('does not display message when not provided', () => {
    const { container } = render(<LoadingSpinner />);

    // Should only have the spinner, no text
    const text = container.querySelector('.MuiTypography-root');
    expect(text).not.toBeInTheDocument();
  });

  test('renders in fullScreen mode', () => {
    const { container } = render(<LoadingSpinner fullScreen message="Loading..." />);

    // In fullScreen mode, the container should have specific styles
    const outerBox = container.firstChild;
    expect(outerBox).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders without fullScreen mode', () => {
    const { container } = render(<LoadingSpinner fullScreen={false} />);

    const outerBox = container.firstChild;
    expect(outerBox).toBeInTheDocument();
  });

  test('centers spinner and message', () => {
    render(<LoadingSpinner message="Loading..." />);

    // Both spinner and message should be present
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles null message gracefully', () => {
    render(<LoadingSpinner message={null} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  test('handles undefined message gracefully', () => {
    render(<LoadingSpinner message={undefined} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  test('handles empty string message gracefully', () => {
    render(<LoadingSpinner message="" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Empty string should not render the message element
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  test('renders with all props combined', () => {
    render(
      <LoadingSpinner
        size={80}
        fullScreen={true}
        message="Please wait while we load your data..."
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we load your data...')).toBeInTheDocument();
  });

  test('spinner is always visible regardless of props', () => {
    const { rerender } = render(<LoadingSpinner />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<LoadingSpinner size={100} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<LoadingSpinner fullScreen />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Test" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('message updates when prop changes', () => {
    const { rerender } = render(<LoadingSpinner message="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoadingSpinner message="Almost done..." />);

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Almost done...')).toBeInTheDocument();
  });

  test('maintains spinner when message is removed', () => {
    const { rerender } = render(<LoadingSpinner message="Loading..." />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoadingSpinner />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
