import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  getAllStorageKeys
} from '../../src/utils/storage';

describe('Storage Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setStorageItem', () => {
    test('stores string value correctly', () => {
      setStorageItem('testKey', 'testValue');

      const stored = localStorage.getItem('clippy_testKey');
      expect(stored).toBe('"testValue"');
    });

    test('stores object value correctly', () => {
      const testObj = { name: 'Test', value: 123 };
      setStorageItem('testObj', testObj);

      const stored = localStorage.getItem('clippy_testObj');
      expect(stored).toBe(JSON.stringify(testObj));
    });

    test('stores array value correctly', () => {
      const testArray = [1, 2, 3, 'four', { five: 5 }];
      setStorageItem('testArray', testArray);

      const stored = localStorage.getItem('clippy_testArray');
      expect(stored).toBe(JSON.stringify(testArray));
    });

    test('stores number value correctly', () => {
      setStorageItem('testNumber', 42);

      const stored = localStorage.getItem('clippy_testNumber');
      expect(stored).toBe('42');
    });

    test('stores boolean value correctly', () => {
      setStorageItem('testBool', true);

      const stored = localStorage.getItem('clippy_testBool');
      expect(stored).toBe('true');
    });

    test('stores null value correctly', () => {
      setStorageItem('testNull', null);

      const stored = localStorage.getItem('clippy_testNull');
      expect(stored).toBe('null');
    });

    test('adds clippy_ prefix to keys', () => {
      setStorageItem('myKey', 'myValue');

      expect(localStorage.getItem('clippy_myKey')).toBeDefined();
      expect(localStorage.getItem('myKey')).toBeNull();
    });

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw, should handle error gracefully
      expect(() => setStorageItem('testKey', 'value')).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('getStorageItem', () => {
    test('retrieves string value correctly', () => {
      localStorage.setItem('clippy_testKey', '"testValue"');

      const value = getStorageItem('testKey');
      expect(value).toBe('testValue');
    });

    test('retrieves object value correctly', () => {
      const testObj = { name: 'Test', value: 123 };
      localStorage.setItem('clippy_testObj', JSON.stringify(testObj));

      const value = getStorageItem('testObj');
      expect(value).toEqual(testObj);
    });

    test('retrieves array value correctly', () => {
      const testArray = [1, 2, 3, 'four'];
      localStorage.setItem('clippy_testArray', JSON.stringify(testArray));

      const value = getStorageItem('testArray');
      expect(value).toEqual(testArray);
    });

    test('returns default value when key does not exist', () => {
      const value = getStorageItem('nonExistent', 'defaultValue');
      expect(value).toBe('defaultValue');
    });

    test('returns null when key does not exist and no default provided', () => {
      const value = getStorageItem('nonExistent');
      expect(value).toBeNull();
    });

    test('handles malformed JSON gracefully', () => {
      localStorage.setItem('clippy_badJson', 'not valid json{{{');

      const value = getStorageItem('badJson', 'default');
      expect(value).toBe('default');
    });

    test('uses clippy_ prefix when retrieving', () => {
      localStorage.setItem('clippy_prefixed', '"value"');

      const value = getStorageItem('prefixed');
      expect(value).toBe('value');
    });

    test('handles localStorage errors gracefully', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const value = getStorageItem('testKey', 'fallback');
      expect(value).toBe('fallback');

      getItemSpy.mockRestore();
    });
  });

  describe('removeStorageItem', () => {
    test('removes existing item', () => {
      setStorageItem('testKey', 'testValue');
      expect(getStorageItem('testKey')).toBe('testValue');

      removeStorageItem('testKey');
      expect(getStorageItem('testKey')).toBeNull();
    });

    test('handles removing non-existent item gracefully', () => {
      expect(() => removeStorageItem('nonExistent')).not.toThrow();
    });

    test('uses clippy_ prefix when removing', () => {
      localStorage.setItem('clippy_toRemove', '"value"');
      expect(localStorage.getItem('clippy_toRemove')).toBeDefined();

      removeStorageItem('toRemove');
      expect(localStorage.getItem('clippy_toRemove')).toBeNull();
    });

    test('handles localStorage errors gracefully', () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(() => removeStorageItem('testKey')).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });

  describe('clearStorage', () => {
    test('removes all clippy_ prefixed items', () => {
      setStorageItem('key1', 'value1');
      setStorageItem('key2', 'value2');
      setStorageItem('key3', 'value3');

      expect(getStorageItem('key1')).toBe('value1');
      expect(getStorageItem('key2')).toBe('value2');
      expect(getStorageItem('key3')).toBe('value3');

      clearStorage();

      expect(getStorageItem('key1')).toBeNull();
      expect(getStorageItem('key2')).toBeNull();
      expect(getStorageItem('key3')).toBeNull();
    });

    test('preserves non-clippy items', () => {
      localStorage.setItem('otherApp_key', 'value');
      setStorageItem('clippyKey', 'value');

      clearStorage();

      expect(localStorage.getItem('otherApp_key')).toBe('value');
      expect(getStorageItem('clippyKey')).toBeNull();
    });

    test('handles empty storage gracefully', () => {
      expect(() => clearStorage()).not.toThrow();
    });

    test('handles localStorage errors gracefully', () => {
      const keysSpy = jest.spyOn(Storage.prototype, 'key');
      keysSpy.mockImplementation(() => {
        throw new Error('Access denied');
      });

      expect(() => clearStorage()).not.toThrow();

      keysSpy.mockRestore();
    });
  });

  describe('getAllStorageKeys', () => {
    test('returns all clippy_ prefixed keys without prefix', () => {
      setStorageItem('key1', 'value1');
      setStorageItem('key2', 'value2');
      setStorageItem('key3', 'value3');

      const keys = getAllStorageKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });

    test('excludes non-clippy items', () => {
      localStorage.setItem('otherApp_key', 'value');
      setStorageItem('clippyKey', 'value');

      const keys = getAllStorageKeys();
      expect(keys).toContain('clippyKey');
      expect(keys).not.toContain('otherApp_key');
      expect(keys.length).toBe(1);
    });

    test('returns empty array when no clippy items exist', () => {
      localStorage.setItem('otherApp_key', 'value');

      const keys = getAllStorageKeys();
      expect(keys).toEqual([]);
    });

    test('returns empty array when storage is empty', () => {
      const keys = getAllStorageKeys();
      expect(keys).toEqual([]);
    });

    test('strips clippy_ prefix from returned keys', () => {
      setStorageItem('testKey', 'value');

      const keys = getAllStorageKeys();
      expect(keys).toContain('testKey');
      expect(keys).not.toContain('clippy_testKey');
    });

    test('handles localStorage errors gracefully', () => {
      const keysSpy = jest.spyOn(Storage.prototype, 'key');
      keysSpy.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const keys = getAllStorageKeys();
      expect(keys).toEqual([]);

      keysSpy.mockRestore();
    });
  });

  describe('Integration tests', () => {
    test('set and get workflow', () => {
      const testData = { user: 'John', age: 30 };
      setStorageItem('userData', testData);

      const retrieved = getStorageItem('userData');
      expect(retrieved).toEqual(testData);
    });

    test('set, get, remove workflow', () => {
      setStorageItem('temp', 'tempValue');
      expect(getStorageItem('temp')).toBe('tempValue');

      removeStorageItem('temp');
      expect(getStorageItem('temp')).toBeNull();
    });

    test('multiple items and clear workflow', () => {
      setStorageItem('item1', 'value1');
      setStorageItem('item2', 'value2');
      setStorageItem('item3', 'value3');

      expect(getAllStorageKeys().length).toBe(3);

      clearStorage();

      expect(getAllStorageKeys().length).toBe(0);
    });

    test('overwriting existing value', () => {
      setStorageItem('key', 'oldValue');
      expect(getStorageItem('key')).toBe('oldValue');

      setStorageItem('key', 'newValue');
      expect(getStorageItem('key')).toBe('newValue');
    });

    test('complex nested object storage', () => {
      const complexData = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true
          }
        },
        history: [1, 2, 3],
        metadata: {
          version: '1.0',
          timestamp: Date.now()
        }
      };

      setStorageItem('complexData', complexData);
      const retrieved = getStorageItem('complexData');

      expect(retrieved).toEqual(complexData);
      expect(retrieved.user.settings.theme).toBe('dark');
      expect(retrieved.history).toEqual([1, 2, 3]);
    });
  });
});
