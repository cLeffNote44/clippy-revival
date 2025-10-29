# API Reference

Complete API reference for Clippy Revival frontend and backend.

## Table of Contents

1. [Frontend APIs](#frontend-apis)
2. [Backend APIs](#backend-apis)
3. [Electron IPC](#electron-ipc)
4. [Utilities](#utilities)
5. [Hooks](#hooks)
6. [Components](#components)

---

## Frontend APIs

### HTTP Client (`src/services/http.js`)

Base HTTP client for API requests.

#### `httpClient`

Axios instance with interceptors.

**Methods:**
```javascript
httpClient.get(url, config)
httpClient.post(url, data, config)
httpClient.put(url, data, config)
httpClient.delete(url, config)
```

**Example:**
```javascript
import { httpClient } from './services/http';

const response = await httpClient.get('/api/system/info');
const data = response.data;
```

### Error Handler (`src/services/errorHandler.js`)

Centralized error handling with user-friendly messages.

#### `handleApiError(error)`

Handles API errors and returns formatted error object.

**Parameters:**
- `error` (Error) - Error object from HTTP request

**Returns:**
- `Object` - `{ title, message, severity, retryable }`

**Example:**
```javascript
import { handleApiError } from './services/errorHandler';

try {
  await httpClient.get('/api/data');
} catch (error) {
  const formattedError = handleApiError(error);
  showToast(formattedError.message, 'error');
}
```

### Storage (`src/utils/storage.js`)

LocalStorage wrapper with JSON serialization.

#### `setStorageItem(key, value)`

Store item in localStorage.

**Parameters:**
- `key` (string) - Storage key (will be prefixed with 'clippy_')
- `value` (any) - Value to store (will be JSON stringified)

#### `getStorageItem(key, defaultValue)`

Retrieve item from localStorage.

**Parameters:**
- `key` (string) - Storage key
- `defaultValue` (any) - Default value if key doesn't exist

**Returns:**
- Stored value or default value

**Example:**
```javascript
import { setStorageItem, getStorageItem } from './utils/storage';

setStorageItem('settings', { theme: 'dark' });
const settings = getStorageItem('settings', {});
```

---

## Backend APIs

### Health Check

**Endpoint:** `GET /health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T..."
}
```

### AI Service

#### Send Message

**Endpoint:** `POST /api/ai/message`

Send message to AI.

**Request Body:**
```json
{
  "message": "Hello, AI!",
  "conversation_id": "conv-123",
  "model": "llama2"
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you?",
  "conversation_id": "conv-123",
  "tokens_used": 45
}
```

#### List Models

**Endpoint:** `GET /api/ai/models`

Get available AI models.

**Response:**
```json
{
  "models": [
    {
      "name": "llama2",
      "size": "7B",
      "available": true
    }
  ]
}
```

### System Monitoring

#### Get System Info

**Endpoint:** `GET /api/system/info`

Get system information.

**Response:**
```json
{
  "cpu_usage": 45.2,
  "memory_usage": 62.8,
  "disk_usage": 75.3,
  "uptime": 3600
}
```

#### Get Processes

**Endpoint:** `GET /api/system/processes`

Get running processes.

**Query Parameters:**
- `limit` (number) - Max number of processes (default: 10)
- `sort_by` (string) - Sort field: 'cpu', 'memory', 'name' (default: 'cpu')

**Response:**
```json
{
  "processes": [
    {
      "pid": 1234,
      "name": "chrome.exe",
      "cpu_percent": 15.3,
      "memory_percent": 8.7
    }
  ]
}
```

### File Operations

#### List Files

**Endpoint:** `GET /api/files/list`

List files in directory.

**Query Parameters:**
- `path` (string) - Directory path (default: user home)

**Response:**
```json
{
  "files": [
    {
      "name": "document.pdf",
      "path": "/path/to/document.pdf",
      "size": 1024000,
      "is_directory": false,
      "modified": "2025-10-29T..."
    }
  ],
  "path": "/path/to/directory"
}
```

#### Read File

**Endpoint:** `GET /api/files/read`

Read file contents.

**Query Parameters:**
- `path` (string) - File path

**Response:**
```json
{
  "content": "File contents here...",
  "encoding": "utf-8",
  "size": 1024
}
```

#### Write File

**Endpoint:** `POST /api/files/write`

Write content to file.

**Request Body:**
```json
{
  "path": "/path/to/file.txt",
  "content": "File contents",
  "encoding": "utf-8"
}
```

**Response:**
```json
{
  "success": true,
  "path": "/path/to/file.txt",
  "size": 13
}
```

---

## Electron IPC

All IPC methods are exposed via `window.electronAPI` in preload script.

### Window Operations

#### `window.electronAPI.minimize()`

Minimize window.

#### `window.electronAPI.maximize()`

Maximize/restore window.

#### `window.electronAPI.close()`

Close window.

### Buddy Window

#### `window.electronAPI.showBuddy()`

Show floating buddy window.

#### `window.electronAPI.hideBuddy()`

Hide buddy window.

### Logging

#### `window.electronAPI.logError(errorData)`

Log error to main process.

**Parameters:**
- `errorData` (Object) - `{ message, stack, componentStack }`

### File Dialog

#### `window.electronAPI.openFileDialog(options)`

Open file selection dialog.

**Parameters:**
- `options` (Object) - Dialog options

**Returns:**
- `Promise<string[]>` - Selected file paths

**Example:**
```javascript
const files = await window.electronAPI.openFileDialog({
  title: 'Select File',
  filters: [{ name: 'Text Files', extensions: ['txt'] }],
  properties: ['openFile', 'multiSelections'],
});
```

---

## Utilities

### Accessibility (`src/utils/accessibility.js`)

#### ARIA Helpers

```javascript
import { aria } from './utils/accessibility';

// ARIA attributes
<button {...aria.label('Close')}>×</button>
<button {...aria.expanded(isOpen)} {...aria.controls('menu-1')}>Menu</button>
<input {...aria.required(true)} {...aria.invalid(hasError)} />
```

#### Focus Manager

```javascript
import { focusManager } from './utils/accessibility';

// Get focusable elements
const focusable = focusManager.getFocusableElements(container);

// Focus first/last
focusManager.focusFirst(container);
focusManager.focusLast(container);

// Save/restore focus
focusManager.saveFocus();
focusManager.restoreFocus();

// Trap focus
focusManager.trapFocus(container, event);
```

#### Color Contrast

```javascript
import { validateContrast } from './utils/accessibility';

const result = validateContrast('#333333', '#FFFFFF', {
  level: 'AA',
  largeText: false,
});

console.log(result.passes); // true
console.log(result.ratio); // 12.63
```

### Performance (`src/utils/performance.js`)

#### Debounce/Throttle

```javascript
import { debounce, throttle } from './utils/performance';

const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

const throttledScroll = throttle((event) => {
  handleScroll(event);
}, 100);
```

#### Performance Tracker

```javascript
import { PerformanceTracker } from './utils/performance';

const tracker = new PerformanceTracker();

tracker.mark('operation-start');
// ... perform operation ...
tracker.mark('operation-end');

const duration = tracker.measure('operation', 'operation-start', 'operation-end');
console.log(`Operation took ${duration}ms`);
```

### Plugins (`src/utils/plugins.js`)

#### Plugin Manager

```javascript
import { pluginManager } from './utils/plugins';

// Register plugin
await pluginManager.registerPlugin(myPlugin);

// Activate plugin
await pluginManager.activatePlugin('plugin-id');

// Get plugins
const plugins = pluginManager.getAllPlugins();
const active = pluginManager.getActivePlugins();

// Execute hook
await pluginManager.executeHook('onMessage', data);
```

### Themes (`src/utils/themes.js`)

#### Theme Manager

```javascript
import { themeManager } from './utils/themes';

// Get themes
const themes = themeManager.getAllThemes();

// Apply theme
themeManager.applyTheme('dark');

// Create theme
const theme = themeManager.createBuilder('light')
  .setName('My Theme')
  .setPrimaryColor('#E91E63')
  .build();

themeManager.registerTheme(theme);
```

### AI Advanced (`src/utils/ai-advanced.js`)

#### Context Memory

```javascript
import { contextMemory } from './utils/ai-advanced';

// Create conversation
contextMemory.createConversation('conv-1', { title: 'Chat' });

// Add messages
contextMemory.addMessage('conv-1', 'user', 'Hello');
contextMemory.addMessage('conv-1', 'assistant', 'Hi there!');

// Get context
const context = contextMemory.getContext('conv-1', {
  maxMessages: 10,
});

// Search
const results = contextMemory.search('keyword', { limit: 10 });
```

#### Persona Manager

```javascript
import { personaManager } from './utils/ai-advanced';

// Set active persona
personaManager.setActivePersona('coding');

// Get persona
const persona = personaManager.getActivePersona();
const config = persona.getAIConfig();

// Use in AI request
const response = await sendToAI({
  message: userMessage,
  ...config,
});
```

---

## Hooks

### useKeyboardNavigation

Navigate through items with arrow keys.

**Parameters:**
- `options` (Object)
  - `enabled` (boolean) - Whether navigation is enabled
  - `orientation` ('vertical'|'horizontal') - Navigation direction
  - `onSelect` (Function) - Callback when item selected
  - `loop` (boolean) - Whether to loop navigation

**Returns:**
- `focusedIndex` (number) - Currently focused index
- `getContainerProps` (Function) - Props for container
- `getItemProps` (Function) - Props for items

**Example:**
```javascript
import { useKeyboardNavigation } from '../hooks/useAccessibility';

const { getContainerProps, getItemProps, focusedIndex } = useKeyboardNavigation({
  orientation: 'vertical',
  onSelect: (index) => handleSelect(index),
});

return (
  <div {...getContainerProps(items.length)}>
    {items.map((item, index) => (
      <button key={index} {...getItemProps(index)}>
        {item.label}
      </button>
    ))}
  </div>
);
```

### useFocusTrap

Trap focus within a container.

**Parameters:**
- `isActive` (boolean) - Whether focus trap is active

**Returns:**
- `containerRef` (Ref) - Ref for container
- `restoreFocus` (Function) - Manually restore focus

**Example:**
```javascript
import { useFocusTrap } from '../hooks/useAccessibility';

const { containerRef } = useFocusTrap(isOpen);

return (
  <div ref={containerRef}>
    <Modal open={isOpen}>
      {content}
    </Modal>
  </div>
);
```

### useDebounce

Debounce a value.

**Parameters:**
- `value` (any) - Value to debounce
- `delay` (number) - Delay in milliseconds

**Returns:**
- Debounced value

**Example:**
```javascript
import { useDebounce } from '../hooks/usePerformance';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### useThrottle

Throttle a value.

**Parameters:**
- `value` (any) - Value to throttle
- `limit` (number) - Time limit in milliseconds

**Returns:**
- Throttled value

---

## Components

### ErrorBoundary

Catches React errors and displays fallback UI.

**Props:**
- `children` (ReactNode) - Child components
- `fallback` (ReactNode) - Custom fallback UI
- `onError` (Function) - Error callback

**Example:**
```javascript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorFallback />} onError={logError}>
  <App />
</ErrorBoundary>
```

### Toast

Toast notification system.

**Methods:**
```javascript
import { useToastStore } from './components/Toast';

const { success, error, warning, info } = useToastStore();

success('Operation successful!');
error('Operation failed');
warning('Be careful!');
info('Information message');
```

### LoadingSpinner

Loading indicator.

**Props:**
- `size` ('small'|'medium'|'large') - Spinner size
- `message` (string) - Loading message

**Example:**
```javascript
import LoadingSpinner from './components/LoadingSpinner';

<LoadingSpinner size="medium" message="Loading data..." />
```

### FocusTrap

Traps keyboard focus within children.

**Props:**
- `active` (boolean) - Whether trap is active
- `autoFocus` (boolean) - Auto-focus first element
- `restoreFocus` (boolean) - Restore focus on deactivate
- `children` (ReactNode) - Child components

**Example:**
```javascript
import FocusTrap from './components/FocusTrap';

<FocusTrap active={isModalOpen} restoreFocus>
  <div className="modal">
    {content}
  </div>
</FocusTrap>
```

### LiveRegion

Screen reader announcements.

**Props:**
- `message` (string) - Message to announce
- `politeness` ('polite'|'assertive'|'off') - Announcement priority
- `clearAfter` (number) - Auto-clear delay (ms)

**Example:**
```javascript
import LiveRegion from './components/LiveRegion';

<LiveRegion.Alert message="Error occurred!" />
<LiveRegion.Status message="Loading complete" />
```

### SkipNavigation

Skip navigation links for keyboard users.

**Props:**
- `links` (Array) - Array of `{ href, text }` objects

**Example:**
```javascript
import SkipNavigation from './components/SkipNavigation';

<SkipNavigation
  links={[
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
  ]}
/>
```

### VirtualList

Virtual scrolling for large lists.

**Props:**
- `items` (Array) - Array of items
- `itemHeight` (number) - Height of each item (px)
- `containerHeight` (number) - Container height (px)
- `renderItem` (Function) - Render function for items
- `overscan` (number) - Number of items to render outside viewport

**Example:**
```javascript
import VirtualList from './components/VirtualList';

<VirtualList
  items={largeArray}
  itemHeight={80}
  containerHeight={600}
  renderItem={(item, index) => <ItemCard item={item} />}
  overscan={3}
/>
```

### LazyImage

Lazy loading image component.

**Props:**
- `src` (string) - Image source URL
- `alt` (string) - Alt text
- `placeholder` (string) - Placeholder image URL
- `width` (number|string) - Image width
- `height` (number|string) - Image height
- `onLoad` (Function) - Load callback
- `onError` (Function) - Error callback

**Example:**
```javascript
import LazyImage from './components/LazyImage';

<LazyImage
  src="/path/to/large-image.jpg"
  alt="Description"
  placeholder="/path/to/placeholder.jpg"
  width={400}
  height={300}
  onLoad={() => console.log('Loaded')}
/>
```

---

## Error Codes

### HTTP Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error (server error)
- `503` - Service Unavailable (server down)

### Application Error Codes

- `ECONNREFUSED` - Backend not running
- `NETWORK_ERROR` - Network connection failed
- `TIMEOUT` - Request timeout
- `AI_MODEL_ERROR` - AI model error
- `FILE_NOT_FOUND` - File doesn't exist
- `PERMISSION_DENIED` - Insufficient permissions

---

## Rate Limits

### Backend API

- **Default**: 60 requests per minute per IP
- **Burst**: 10 requests per second
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### AI Service

- **Message**: 30 requests per minute
- **Models**: 10 requests per minute

---

## Versioning

API versioning follows semantic versioning (semver):

- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

Current API version: **v1.0.0**

---

## Deprecation Policy

Deprecated APIs will:
1. Be marked as deprecated in documentation
2. Log warnings in development
3. Be supported for at least 6 months
4. Be removed in next major version

---

## Support

For API questions or issues:
- Check [Developer Guide](./DEVELOPER_GUIDE.md)
- Review [Examples](../examples/)
- Search [GitHub Issues](https://github.com/your-org/clippy-revival/issues)
- Ask in [Discussions](https://github.com/your-org/clippy-revival/discussions)
