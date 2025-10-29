# Security Guide for Clippy Revival

This document outlines the security measures implemented in Clippy Revival and provides guidelines for maintaining security best practices.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Frontend Security](#frontend-security)
3. [Electron Security](#electron-security)
4. [Backend Security](#backend-security)
5. [Input Validation](#input-validation)
6. [Rate Limiting](#rate-limiting)
7. [Content Security Policy](#content-security-policy)
8. [IPC Security](#ipc-security)
9. [Best Practices](#best-practices)
10. [Security Checklist](#security-checklist)
11. [Reporting Security Issues](#reporting-security-issues)

## Security Overview

Clippy Revival implements defense-in-depth security with multiple layers of protection:

- **Frontend**: Input sanitization, XSS prevention, React security best practices
- **Electron**: Context isolation, sandboxing, IPC whitelisting
- **Backend**: Rate limiting, security headers, input validation
- **Network**: CORS configuration, localhost-only binding, no external access

### Security Architecture

```
┌─────────────────────────────────────────────┐
│           User Interface (React)            │
│  - Input sanitization                       │
│  - XSS prevention                           │
│  - Output encoding                          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Electron Main Process               │
│  - Context isolation                        │
│  - IPC whitelisting                         │
│  - Navigation protection                    │
│  - Content Security Policy                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        FastAPI Backend (Python)             │
│  - Rate limiting                            │
│  - Security headers                         │
│  - Input validation                         │
│  - CORS restrictions                        │
└─────────────────────────────────────────────┘
```

## Frontend Security

### Input Sanitization

The application provides comprehensive input sanitization utilities in `src/utils/security.js`:

```javascript
import { sanitizeInput, escapeHtml } from '../utils/security';

// Sanitize user input
const cleanInput = sanitizeInput(userInput, {
  allowNewlines: true,
  allowTabs: false,
  maxLength: 1000,
  trim: true
});

// Escape HTML for display
const safeHtml = escapeHtml(untrustedText);
```

### Available Security Functions

#### `escapeHtml(text)`
Escapes HTML special characters to prevent XSS attacks.

```javascript
escapeHtml('<script>alert("xss")</script>');
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

#### `sanitizeInput(input, options)`
Removes potentially dangerous content from user input.

```javascript
sanitizeInput('Hello\x00World\t!', {
  allowTabs: false,
  maxLength: 100
});
// Returns: 'Hello World!'
```

#### `isValidEmail(email)`
Validates email address format.

#### `isValidUrl(url, options)`
Validates URL format with protocol and hostname checks.

#### `sanitizeFilename(filename)`
Removes unsafe characters from filenames.

#### `validateChatMessage(message)`
Validates and sanitizes chat messages.

```javascript
const result = validateChatMessage(userMessage);
if (result.valid) {
  sendMessage(result.sanitized);
} else {
  showError(result.error);
}
```

### XSS Prevention

**Always sanitize user input before displaying:**

✅ **Good:**
```javascript
const userComment = escapeHtml(comment);
return <div>{userComment}</div>;
```

❌ **Bad:**
```javascript
return <div dangerouslySetInnerHTML={{ __html: comment }} />;
```

### React Security Best Practices

1. **Never use `dangerouslySetInnerHTML` with untrusted content**
2. **Validate all user input before processing**
3. **Use `textContent` instead of `innerHTML` when possible**
4. **Sanitize data from external sources (APIs, localStorage)**

## Electron Security

### Context Isolation

Context isolation is **enabled** to prevent renderer processes from accessing Node.js directly:

```javascript
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}
```

### Security-Critical Settings

All windows use these secure webPreferences:

```javascript
{
  contextIsolation: true,           // Isolate renderer from main process
  nodeIntegration: false,            // Disable Node.js in renderer
  nodeIntegrationInWorker: false,    // Disable in web workers
  nodeIntegrationInSubFrames: false, // Disable in iframes
  webSecurity: true,                 // Enable web security
  sandbox: true,                     // Enable sandbox
  webviewTag: false,                 // Disable <webview> tag
  enableRemoteModule: false,         // Disable remote module
  allowRunningInsecureContent: false,// Block mixed content
  experimentalFeatures: false,       // Disable experimental features
  navigateOnDragDrop: false         // Disable drag-drop navigation
}
```

### Navigation Protection

The application prevents navigation to external URLs:

```javascript
window.webContents.on('will-navigate', (event, url) => {
  if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
    event.preventDefault();
    shell.openExternal(url); // Open in external browser
  }
});
```

## Content Security Policy

CSP headers are set for all windows to restrict resource loading:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

### CSP Directives Explained

- `default-src 'self'` - Only load resources from same origin
- `script-src 'self' 'unsafe-inline'` - Only scripts from app (unsafe-inline needed for React dev)
- `connect-src` - Only connect to localhost (for backend API)
- `frame-src 'none'` - No iframes allowed
- `object-src 'none'` - No plugins (Flash, Java, etc.)

**Note:** `'unsafe-inline'` is used for development. For production, consider using nonces.

## IPC Security

### Channel Whitelisting

Only explicitly allowed IPC channels can be used:

```javascript
const ALLOWED_CHANNELS = {
  invoke: [
    'get-backend-url',
    'show-dashboard',
    'show-buddy',
    'hide-buddy',
    'set-buddy-click-through',
    'select-file',
    'select-directory',
    'log-error'
  ],
  on: [
    'assistant-paused',
    'navigate'
  ]
};
```

### Input Validation

All IPC inputs are validated:

```javascript
setBuddyClickThrough: (clickThrough) => {
  validateChannel('set-buddy-click-through', 'invoke');

  // Type validation
  if (typeof clickThrough !== 'boolean') {
    throw new Error('clickThrough must be a boolean');
  }

  return ipcRenderer.invoke('set-buddy-click-through', clickThrough);
}
```

### Adding New IPC Channels

When adding new IPC channels:

1. **Add to whitelist** in `electron/preload.js`
2. **Add validation** for all parameters
3. **Implement handler** in `electron/main.js`
4. **Document** the channel in code comments

**Example:**

```javascript
// In preload.js
const ALLOWED_CHANNELS = {
  invoke: [
    'get-backend-url',
    'my-new-channel' // Add here
  ]
};

// Add validation
myNewFunction: (param) => {
  validateChannel('my-new-channel', 'invoke');

  // Validate input
  if (typeof param !== 'string') {
    throw new Error('param must be a string');
  }

  return ipcRenderer.invoke('my-new-channel', param);
}
```

## Backend Security

### Security Headers

All HTTP responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Rate Limiting

Rate limiting is implemented to prevent abuse:

- **60 requests per minute** per IP address
- **10 requests per second** burst limit
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

**Rate Limit Response:**
```json
{
  "detail": "Too many requests. Please try again later."
}
```
HTTP Status: `429 Too Many Requests`

### Input Validation

The backend validates all inputs:

```python
from middleware.security import sanitize_string, validate_json_safe, validate_path

# Sanitize string input
clean_input = sanitize_string(user_input, max_length=1000)

# Validate JSON to prevent prototype pollution
clean_data = validate_json_safe(request_data)

# Validate file paths
if not validate_path(file_path):
    raise HTTPException(status_code=400, detail="Invalid file path")
```

### CORS Configuration

CORS is restricted to localhost only:

```python
allow_origins=[
    "http://localhost:5173",  # Dev server
    "http://127.0.0.1:5173",  # Dev server alt
]
```

**No external origins are allowed.**

### Content Length Limits

Maximum request body size: **10 MB**

Requests exceeding this limit receive `413 Request Entity Too Large`.

## Input Validation

### Frontend Validation

Use security utilities for all user inputs:

```javascript
import {
  validateChatMessage,
  isValidEmail,
  isValidUrl,
  sanitizeFilename
} from '../utils/security';

// Chat messages
const result = validateChatMessage(message);
if (!result.valid) {
  showError(result.error);
  return;
}

// Email addresses
if (!isValidEmail(email)) {
  showError('Invalid email format');
  return;
}

// URLs
if (!isValidUrl(url, { allowedProtocols: ['https'] })) {
  showError('Invalid or insecure URL');
  return;
}

// Filenames
const safeName = sanitizeFilename(userFilename);
```

### Backend Validation

All API endpoints validate inputs:

```python
from pydantic import BaseModel, validator, Field

class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)

    @validator('message')
    def sanitize_message(cls, v):
        # Remove control characters
        return sanitize_string(v, max_length=4000)
```

## Rate Limiting

### Frontend Rate Limiting

Use the `RateLimiter` class for client-side rate limiting:

```javascript
import { RateLimiter } from '../utils/security';

// Create rate limiter: 10 requests per minute
const apiLimiter = new RateLimiter(10, 60000);

async function callAPI(endpoint) {
  const key = 'api-calls';

  if (!apiLimiter.isAllowed(key)) {
    const remaining = apiLimiter.getRemaining(key);
    throw new Error(`Rate limit exceeded. ${remaining} requests remaining.`);
  }

  return await fetch(endpoint);
}
```

### Backend Rate Limiting

Automatically applied to all routes. Monitor rate limit headers:

```javascript
const response = await fetch('/api/endpoint');

const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

console.log(`Rate limit: ${remaining}/${limit} requests remaining`);
```

## Best Practices

### 1. Never Trust User Input

Always validate and sanitize all user input:

```javascript
// ✅ Good
const safeInput = sanitizeInput(userInput);
processData(safeInput);

// ❌ Bad
processData(userInput);
```

### 2. Use Parameterized Queries

Never concatenate user input into SQL/commands:

```javascript
// ✅ Good
db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ Bad
db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 3. Validate File Paths

Prevent directory traversal:

```javascript
import { isValidFilePath } from '../utils/security';

if (!isValidFilePath(userPath)) {
  throw new Error('Invalid file path');
}
```

### 4. Escape Output

Escape data before displaying:

```javascript
import { escapeHtml } from '../utils/security';

const safeComment = escapeHtml(userComment);
```

### 5. Use HTTPS in Production

Always use HTTPS for external communications.

### 6. Keep Dependencies Updated

Regularly update dependencies to patch security vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Python dependencies
pip list --outdated
```

### 7. Log Security Events

Log security-relevant events:

```javascript
// Log failed authentication
logger.warn('Failed login attempt', { username, ip });

// Log suspicious activity
logger.error('Directory traversal attempt', { path, ip });
```

### 8. Review IPC Channels

Regularly review and audit IPC channels:

- Only whitelist necessary channels
- Validate all inputs
- Document each channel's purpose

## Security Checklist

Use this checklist when adding new features:

### Frontend

- [ ] User input is validated
- [ ] Input is sanitized before processing
- [ ] Output is escaped before display
- [ ] No use of `dangerouslySetInnerHTML` with untrusted content
- [ ] API calls use proper error handling
- [ ] Sensitive data is not stored in localStorage
- [ ] HTTPS is used for external resources

### Backend

- [ ] API endpoint has rate limiting
- [ ] Input validation with Pydantic models
- [ ] SQL queries use parameterization
- [ ] File operations validate paths
- [ ] Errors don't leak sensitive information
- [ ] Security headers are set
- [ ] CORS is properly configured

### Electron

- [ ] New IPC channels are whitelisted
- [ ] IPC inputs are validated
- [ ] Context isolation is maintained
- [ ] Node integration remains disabled
- [ ] Navigation protection is in place
- [ ] CSP headers are configured

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. **Email** security details to [your-security-email]
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Updates

This document is maintained alongside the codebase. Check the git history for security-related changes:

```bash
git log --grep="security" --all
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://react.dev/learn/security)

## Conclusion

Security is an ongoing process. Regularly review this guide, keep dependencies updated, and stay informed about new security threats and best practices.

For questions or concerns about security, contact the development team.
