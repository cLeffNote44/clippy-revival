import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Test Infrastructure', () => {
  test('React Testing Library works', () => {
    render(<div data-testid="test">Hello World</div>);
    expect(screen.getByTestId('test')).toHaveTextContent('Hello World');
  });

  test('Jest mocks work', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('electronAPI is mocked', () => {
    expect(global.electronAPI).toBeDefined();
    expect(global.electronAPI.getBackendUrl).toBeDefined();
  });

  test('WebSocket is mocked', () => {
    const ws = new WebSocket('ws://test');
    expect(ws).toBeDefined();
    expect(ws.send).toBeDefined();
  });
});