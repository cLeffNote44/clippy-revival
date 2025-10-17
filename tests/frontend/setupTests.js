// Jest setup file for React Testing Library
import '@testing-library/jest-dom';

// Mock window.electronAPI
global.electronAPI = {
  getBackendUrl: jest.fn(() => Promise.resolve('http://localhost:43110')),
  showDashboard: jest.fn(),
  showBuddy: jest.fn(),
  hideBuddy: jest.fn(),
  setBuddyClickThrough: jest.fn(),
  onAssistantPaused: jest.fn(),
  onNavigate: jest.fn(),
  sendToBackend: jest.fn(() => Promise.resolve({})),
  connectWebSocket: jest.fn(() => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  selectFile: jest.fn(),
  selectDirectory: jest.fn(),
  getPlatform: jest.fn(() => 'win32'),
  getVersion: jest.fn(() => '28.0.0')
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200
  })
);

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 0);
  }
  
  send(data) {
    // Mock send
  }
  
  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
  
  addEventListener(event, handler) {
    this[`on${event}`] = handler;
  }
  
  removeEventListener(event, handler) {
    if (this[`on${event}`] === handler) {
      this[`on${event}`] = null;
    }
  }
}

global.WebSocket = MockWebSocket;

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: navigation') ||
       args[0].includes('Warning: ReactDOM.render'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});