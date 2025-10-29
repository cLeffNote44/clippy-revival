import {
  SHORTCUTS,
  registerShortcut,
  unregisterShortcut,
  initKeyboardShortcuts,
  cleanupKeyboardShortcuts,
  setShortcutsEnabled,
  getAllShortcuts,
  formatShortcut
} from '../../src/utils/keyboardShortcuts';

// Helper to create keyboard events
const createKeyboardEvent = (key, modifiers = {}) => {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrl || false,
    shiftKey: modifiers.shift || false,
    altKey: modifiers.alt || false,
    bubbles: true,
    cancelable: true
  });
};

describe('keyboardShortcuts Utility', () => {
  beforeEach(() => {
    // Clean up before each test
    cleanupKeyboardShortcuts();
  });

  afterEach(() => {
    cleanupKeyboardShortcuts();
  });

  describe('SHORTCUTS constant', () => {
    test('defines SHOW_DASHBOARD shortcut', () => {
      expect(SHORTCUTS.SHOW_DASHBOARD).toBeDefined();
      expect(SHORTCUTS.SHOW_DASHBOARD.key).toBe('d');
      expect(SHORTCUTS.SHOW_DASHBOARD.ctrl).toBe(true);
      expect(SHORTCUTS.SHOW_DASHBOARD.description).toBe('Show Dashboard');
    });

    test('defines SHOW_BUDDY shortcut', () => {
      expect(SHORTCUTS.SHOW_BUDDY).toBeDefined();
      expect(SHORTCUTS.SHOW_BUDDY.key).toBe('b');
      expect(SHORTCUTS.SHOW_BUDDY.ctrl).toBe(true);
    });

    test('defines SHOW_SETTINGS shortcut', () => {
      expect(SHORTCUTS.SHOW_SETTINGS).toBeDefined();
      expect(SHORTCUTS.SHOW_SETTINGS.key).toBe(',');
      expect(SHORTCUTS.SHOW_SETTINGS.ctrl).toBe(true);
    });

    test('defines SEND_MESSAGE shortcut', () => {
      expect(SHORTCUTS.SEND_MESSAGE).toBeDefined();
      expect(SHORTCUTS.SEND_MESSAGE.key).toBe('Enter');
      expect(SHORTCUTS.SEND_MESSAGE.ctrl).toBe(true);
    });

    test('defines CLOSE_WINDOW shortcut', () => {
      expect(SHORTCUTS.CLOSE_WINDOW).toBeDefined();
      expect(SHORTCUTS.CLOSE_WINDOW.key).toBe('Escape');
    });

    test('defines REFRESH shortcut', () => {
      expect(SHORTCUTS.REFRESH).toBeDefined();
      expect(SHORTCUTS.REFRESH.key).toBe('r');
      expect(SHORTCUTS.REFRESH.ctrl).toBe(true);
    });

    test('defines SEARCH shortcut', () => {
      expect(SHORTCUTS.SEARCH).toBeDefined();
      expect(SHORTCUTS.SEARCH.key).toBe('f');
      expect(SHORTCUTS.SEARCH.ctrl).toBe(true);
    });

    test('defines SHOW_HELP shortcut with shift modifier', () => {
      expect(SHORTCUTS.SHOW_HELP).toBeDefined();
      expect(SHORTCUTS.SHOW_HELP.key).toBe('h');
      expect(SHORTCUTS.SHOW_HELP.ctrl).toBe(true);
      expect(SHORTCUTS.SHOW_HELP.shift).toBe(true);
    });
  });

  describe('registerShortcut', () => {
    test('registers a shortcut with callback', () => {
      const callback = jest.fn();

      registerShortcut('SHOW_DASHBOARD', callback);

      const registered = getAllShortcuts();
      expect(registered).toHaveLength(1);
      expect(registered[0].name).toBe('SHOW_DASHBOARD');
      expect(registered[0].callback).toBe(callback);
    });

    test('warns when registering unknown shortcut', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const callback = jest.fn();

      registerShortcut('UNKNOWN_SHORTCUT', callback);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown shortcut: UNKNOWN_SHORTCUT');

      consoleSpy.mockRestore();
    });

    test('allows multiple shortcuts to be registered', () => {
      registerShortcut('SHOW_DASHBOARD', jest.fn());
      registerShortcut('SHOW_BUDDY', jest.fn());
      registerShortcut('REFRESH', jest.fn());

      const registered = getAllShortcuts();
      expect(registered).toHaveLength(3);
    });

    test('overwrites existing shortcut with same name', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      registerShortcut('SHOW_DASHBOARD', callback1);
      registerShortcut('SHOW_DASHBOARD', callback2);

      const registered = getAllShortcuts();
      expect(registered).toHaveLength(1);
      expect(registered[0].callback).toBe(callback2);
    });
  });

  describe('unregisterShortcut', () => {
    test('removes registered shortcut', () => {
      registerShortcut('SHOW_DASHBOARD', jest.fn());
      expect(getAllShortcuts()).toHaveLength(1);

      unregisterShortcut('SHOW_DASHBOARD');
      expect(getAllShortcuts()).toHaveLength(0);
    });

    test('does not throw when unregistering non-existent shortcut', () => {
      expect(() => unregisterShortcut('NON_EXISTENT')).not.toThrow();
    });

    test('leaves other shortcuts intact', () => {
      registerShortcut('SHOW_DASHBOARD', jest.fn());
      registerShortcut('SHOW_BUDDY', jest.fn());

      unregisterShortcut('SHOW_DASHBOARD');

      const registered = getAllShortcuts();
      expect(registered).toHaveLength(1);
      expect(registered[0].name).toBe('SHOW_BUDDY');
    });
  });

  describe('initKeyboardShortcuts and event handling', () => {
    test('triggers callback when matching shortcut is pressed', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('d', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(event);
    });

    test('prevents default when shortcut is triggered', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('d', { ctrl: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('stops propagation when shortcut is triggered', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('d', { ctrl: true });
      const stopPropSpy = jest.spyOn(event, 'stopPropagation');

      document.dispatchEvent(event);

      expect(stopPropSpy).toHaveBeenCalled();
    });

    test('does not trigger when wrong key is pressed', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('x', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('does not trigger when modifier is missing', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('d');
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('handles shortcuts with shift modifier', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_HELP', callback);

      const event = createKeyboardEvent('h', { ctrl: true, shift: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('does not trigger shift shortcut without shift', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_HELP', callback);

      const event = createKeyboardEvent('h', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('ignores shortcuts in input fields', () => {
      const callback = jest.fn();
      const input = document.createElement('input');
      document.body.appendChild(input);

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('d', { ctrl: true });
      Object.defineProperty(event, 'target', { value: input, writable: false });

      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    test('ignores shortcuts in textarea fields', () => {
      const callback = jest.fn();
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('d', { ctrl: true });
      Object.defineProperty(event, 'target', { value: textarea, writable: false });

      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    test('allows Escape to blur input fields', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const blurSpy = jest.spyOn(input, 'blur');

      initKeyboardShortcuts();

      const event = createKeyboardEvent('Escape');
      Object.defineProperty(event, 'target', { value: input, writable: false });

      document.dispatchEvent(event);

      expect(blurSpy).toHaveBeenCalled();

      document.body.removeChild(input);
    });

    test('case insensitive key matching', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      const event = createKeyboardEvent('D', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanupKeyboardShortcuts', () => {
    test('removes event listener', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      cleanupKeyboardShortcuts();

      const event = createKeyboardEvent('d', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('clears all registered shortcuts', () => {
      registerShortcut('SHOW_DASHBOARD', jest.fn());
      registerShortcut('SHOW_BUDDY', jest.fn());

      expect(getAllShortcuts()).toHaveLength(2);

      cleanupKeyboardShortcuts();

      expect(getAllShortcuts()).toHaveLength(0);
    });
  });

  describe('setShortcutsEnabled', () => {
    test('disables shortcuts when set to false', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      setShortcutsEnabled(false);

      const event = createKeyboardEvent('d', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('re-enables shortcuts when set to true', () => {
      const callback = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback);

      setShortcutsEnabled(false);
      setShortcutsEnabled(true);

      const event = createKeyboardEvent('d', { ctrl: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllShortcuts', () => {
    test('returns empty array when no shortcuts registered', () => {
      expect(getAllShortcuts()).toEqual([]);
    });

    test('returns all registered shortcuts', () => {
      registerShortcut('SHOW_DASHBOARD', jest.fn());
      registerShortcut('SHOW_BUDDY', jest.fn());

      const shortcuts = getAllShortcuts();
      expect(shortcuts).toHaveLength(2);
      expect(shortcuts.map(s => s.name)).toContain('SHOW_DASHBOARD');
      expect(shortcuts.map(s => s.name)).toContain('SHOW_BUDDY');
    });

    test('includes shortcut details', () => {
      const callback = jest.fn();
      registerShortcut('SHOW_DASHBOARD', callback);

      const shortcuts = getAllShortcuts();
      expect(shortcuts[0]).toHaveProperty('name', 'SHOW_DASHBOARD');
      expect(shortcuts[0]).toHaveProperty('key', 'd');
      expect(shortcuts[0]).toHaveProperty('ctrl', true);
      expect(shortcuts[0]).toHaveProperty('description', 'Show Dashboard');
      expect(shortcuts[0]).toHaveProperty('callback', callback);
    });
  });

  describe('formatShortcut', () => {
    test('formats simple key', () => {
      const formatted = formatShortcut({ key: 'a' });
      expect(formatted).toBe('A');
    });

    test('formats Ctrl+key', () => {
      const formatted = formatShortcut({ key: 'd', ctrl: true });
      expect(formatted).toBe('Ctrl + D');
    });

    test('formats Ctrl+Shift+key', () => {
      const formatted = formatShortcut({ key: 'h', ctrl: true, shift: true });
      expect(formatted).toBe('Ctrl + Shift + H');
    });

    test('formats Alt+key', () => {
      const formatted = formatShortcut({ key: 'f', alt: true });
      expect(formatted).toBe('Alt + F');
    });

    test('formats Ctrl+Alt+Shift+key', () => {
      const formatted = formatShortcut({ key: 'x', ctrl: true, alt: true, shift: true });
      expect(formatted).toBe('Ctrl + Shift + Alt + X');
    });

    test('uppercases key in output', () => {
      const formatted = formatShortcut({ key: 'escape' });
      expect(formatted).toBe('ESCAPE');
    });

    test('formats special keys', () => {
      expect(formatShortcut({ key: 'Enter' })).toBe('ENTER');
      expect(formatShortcut({ key: 'Escape' })).toBe('ESCAPE');
      expect(formatShortcut({ key: ',' })).toBe(',');
    });
  });

  describe('Multiple shortcuts integration', () => {
    test('handles multiple shortcuts independently', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      initKeyboardShortcuts();
      registerShortcut('SHOW_DASHBOARD', callback1);
      registerShortcut('SHOW_BUDDY', callback2);
      registerShortcut('REFRESH', callback3);

      document.dispatchEvent(createKeyboardEvent('d', { ctrl: true }));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      document.dispatchEvent(createKeyboardEvent('b', { ctrl: true }));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).not.toHaveBeenCalled();

      document.dispatchEvent(createKeyboardEvent('r', { ctrl: true }));
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });
});
