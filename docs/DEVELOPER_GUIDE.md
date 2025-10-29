# Developer Guide

Complete guide for developers working on Clippy Revival.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Architecture Overview](#architecture-overview)
5. [Frontend Development](#frontend-development)
6. [Backend Development](#backend-development)
7. [Testing](#testing)
8. [Building and Packaging](#building-and-packaging)
9. [Contributing](#contributing)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js**: 20 LTS or higher
- **Python**: 3.12 or higher
- **Git**: Latest version
- **Ollama**: For AI features (optional)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/clippy-revival.git
cd clippy-revival

# Install dependencies
npm install

# Install Python dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Start development
npm run dev
```

### Development Modes

```bash
# Start all services in development mode
npm run dev

# Start only frontend (React dev server)
npm run dev:renderer

# Start only backend (FastAPI with hot reload)
npm run dev:backend

# Start Electron app
npm run dev:electron
```

---

## Project Structure

```
clippy-revival/
├── backend/                 # Python FastAPI backend
│   ├── app.py              # Main FastAPI application
│   ├── services/           # Business logic services
│   ├── middleware/         # Custom middleware
│   ├── models/             # Pydantic models
│   └── tests/              # Backend tests
├── electron/               # Electron main process
│   ├── main.js             # Main process entry
│   ├── preload.js          # Preload script (IPC)
│   └── logger.js           # Logging utility
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── App.js              # Main App component
├── tests/                  # Frontend tests
│   ├── frontend/           # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── docs/                   # Documentation
├── examples/               # Example plugins and themes
└── scripts/                # Build and utility scripts
```

### Key Directories

**Backend (`backend/`)**
- `app.py` - FastAPI application setup
- `services/` - AI, system monitoring, file operations
- `middleware/` - Security, rate limiting, validation
- `models/` - Request/response models

**Frontend (`src/`)**
- `components/` - Reusable UI components
- `pages/` - Page-level components
- `services/` - API clients and utilities
- `hooks/` - Custom React hooks
- `utils/` - Utilities (accessibility, performance, themes, plugins, AI)

**Electron (`electron/`)**
- `main.js` - Main process (window management, IPC)
- `preload.js` - Preload script (secure IPC bridge)
- `logger.js` - Structured logging

---

## Development Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/my-feature

# Create bugfix branch
git checkout -b fix/bug-description

# Create docs branch
git checkout -b docs/documentation-update
```

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Code Review Process

1. Create feature branch
2. Make changes with tests
3. Run linters and tests
4. Create pull request
5. Address review feedback
6. Merge after approval

### Development Best Practices

**Frontend:**
```javascript
// Use hooks for state management
const [state, setState] = useState(initialState);

// Use custom hooks for reusable logic
const { data, loading, error } = useAPI('/api/endpoint');

// PropTypes for type checking
Component.propTypes = {
  prop: PropTypes.string.isRequired,
};

// Accessibility
<button aria-label="Close" onClick={handleClose}>×</button>
```

**Backend:**
```python
# Type hints for all functions
def process_data(data: dict) -> ProcessedData:
    pass

# Pydantic models for validation
class UserRequest(BaseModel):
    name: str
    age: int = Field(ge=0, le=150)

# Async/await for I/O operations
async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()
```

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Renderer)    │
└────────┬────────┘
         │ IPC (Electron)
┌────────┴────────┐
│ Electron Main   │
│    Process      │
└────────┬────────┘
         │ HTTP/WebSocket
┌────────┴────────┐
│  FastAPI        │
│   Backend       │
└────────┬────────┘
         │
┌────────┴────────┐
│   Ollama AI     │
│   Local Models  │
└─────────────────┘
```

### Communication Flow

**Frontend → Backend:**
```javascript
// HTTP requests via services/http.js
import { httpClient } from './services/http';

const response = await httpClient.get('/api/endpoint');
```

**Frontend → Electron (IPC):**
```javascript
// Via window.electronAPI (exposed in preload.js)
const result = await window.electronAPI.invoke('channel-name', data);
```

**Backend → Ollama:**
```python
# Via services/ai.py
from services.ai import send_message

response = await send_message("Hello, AI!")
```

### State Management

**Global State:**
- Zustand for lightweight state (Toast notifications)
- React Context for theme/settings
- LocalStorage for persistence

**Component State:**
- `useState` for local component state
- `useReducer` for complex state logic
- Custom hooks for shared state logic

---

## Frontend Development

### Component Development

#### Creating a New Component

```javascript
// src/components/MyComponent.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

/**
 * MyComponent description
 *
 * @component
 * @example
 * <MyComponent title="Hello" onAction={handleAction} />
 */
const MyComponent = ({ title, onAction }) => {
  const handleClick = () => {
    onAction?.();
  };

  return (
    <Box>
      <Typography variant="h5">{title}</Typography>
      <button onClick={handleClick}>Action</button>
    </Box>
  );
};

MyComponent.propTypes = {
  /** Component title */
  title: PropTypes.string.isRequired,
  /** Action handler */
  onAction: PropTypes.func,
};

export default MyComponent;
```

#### Using Custom Hooks

```javascript
// Example: useAPI hook
import { useAPI } from '../hooks/useAPI';

function MyComponent() {
  const { data, loading, error, refetch } = useAPI('/api/data');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <DataDisplay data={data} onRefresh={refetch} />;
}
```

#### Styling with Material-UI

```javascript
import { Box, styled } from '@mui/material';

// Styled components
const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

// Or inline sx prop
<Box
  sx={{
    p: 2,
    bgcolor: 'background.paper',
    borderRadius: 1,
  }}
>
  Content
</Box>
```

### Working with Services

```javascript
// src/services/myService.js
import { httpClient } from './http';

export const myService = {
  async getData() {
    const response = await httpClient.get('/api/data');
    return response.data;
  },

  async postData(data) {
    const response = await httpClient.post('/api/data', data);
    return response.data;
  },
};

// Usage in component
import { myService } from '../services/myService';

const data = await myService.getData();
```

### Electron IPC

```javascript
// In preload.js - expose IPC methods
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
});

// In main.js - handle IPC
ipcMain.handle('my-channel', async (event, data) => {
  // Process request
  return result;
});

// In React - use IPC
const result = await window.electronAPI.invoke('my-channel', data);
```

---

## Backend Development

### Creating API Endpoints

```python
# backend/app.py or backend/routes/my_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ItemRequest(BaseModel):
    name: str
    value: int

class ItemResponse(BaseModel):
    id: str
    name: str
    value: int

@router.post("/items", response_model=ItemResponse)
async def create_item(item: ItemRequest):
    """Create a new item."""
    # Process request
    new_item = {
        "id": generate_id(),
        "name": item.name,
        "value": item.value,
    }
    return new_item

@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    """Get item by ID."""
    item = find_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

### Using Services

```python
# backend/services/my_service.py
class MyService:
    def __init__(self):
        self.data = {}

    async def process_data(self, data: dict) -> dict:
        """Process data asynchronously."""
        # Perform async operations
        result = await self.async_operation(data)
        return result

    async def async_operation(self, data: dict) -> dict:
        # Async I/O operation
        return processed_data

# Usage in routes
from services.my_service import MyService

service = MyService()

@router.post("/process")
async def process(data: dict):
    result = await service.process_data(data)
    return result
```

### Middleware

```python
# backend/middleware/my_middleware.py
from starlette.middleware.base import BaseHTTPMiddleware

class MyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Pre-processing
        print(f"Request: {request.url}")

        response = await call_next(request)

        # Post-processing
        print(f"Response: {response.status_code}")

        return response

# Register in app.py
from middleware.my_middleware import MyMiddleware

app.add_middleware(MyMiddleware)
```

### Database Operations

```python
# Example with SQLAlchemy (if using database)
from sqlalchemy import select
from database import async_session

async def get_items():
    async with async_session() as session:
        result = await session.execute(
            select(Item).where(Item.active == True)
        )
        return result.scalars().all()
```

---

## Testing

### Frontend Unit Tests

```javascript
// tests/frontend/MyComponent.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const onAction = jest.fn();
    render(<MyComponent title="Test" onAction={onAction} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

### Backend Tests

```python
# backend/tests/test_my_service.py
import pytest
from services.my_service import MyService

@pytest.fixture
def service():
    return MyService()

@pytest.mark.asyncio
async def test_process_data(service):
    data = {"key": "value"}
    result = await service.process_data(data)

    assert result is not None
    assert "processed" in result

@pytest.mark.asyncio
async def test_api_endpoint(client):
    response = await client.post("/api/items", json={"name": "test"})

    assert response.status_code == 200
    assert response.json()["name"] == "test"
```

### E2E Tests

```javascript
// tests/e2e/flow.spec.js
import { test, expect } from '@playwright/test';

test('complete user flow', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load
  await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

  // Interact with UI
  await page.getByRole('button', { name: /Open Chat/i }).click();

  // Verify result
  await expect(page.getByText(/Chat/i)).toBeVisible();
});
```

### Running Tests

```bash
# Frontend unit tests
npm test

# Backend tests
cd backend
pytest

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

---

## Building and Packaging

### Development Build

```bash
# Build frontend
npm run build:renderer

# Build Electron
npm run build:electron
```

### Production Build

```bash
# Full production build
npm run build

# Package for Windows
npm run package:win

# Package for macOS
npm run package:mac

# Package for Linux
npm run package:linux
```

### Build Configuration

#### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
```

#### Electron Builder Configuration

```json
// package.json
{
  "build": {
    "appId": "com.clippyrevival.app",
    "productName": "Clippy Revival",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "backend/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
}
```

---

## Contributing

### Code Style

**JavaScript/React:**
- Use ES6+ features
- Functional components with hooks
- PropTypes for type checking
- 2-space indentation
- Semicolons required

**Python:**
- PEP 8 style guide
- Type hints for all functions
- 4-space indentation
- Async/await for I/O operations

### Pull Request Guidelines

1. **Branch Naming**: `feature/`, `fix/`, `docs/`
2. **Commit Messages**: Conventional commits
3. **Tests**: Include tests for new features
4. **Documentation**: Update docs for API changes
5. **Code Review**: Address all review comments

### Documentation Standards

- JSDoc for JavaScript functions
- Docstrings for Python functions
- README for each major directory
- Examples for complex features

---

## Troubleshooting

### Common Issues

**Frontend not connecting to backend:**
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS configuration in backend/app.py
# Verify frontend is using correct API URL
```

**Electron IPC not working:**
```bash
# Verify preload script is loaded
# Check contextIsolation is enabled
# Ensure channels are whitelisted
```

**Build failures:**
```bash
# Clear caches
npm run clean
rm -rf node_modules
npm install

# Clear Python cache
cd backend
rm -rf __pycache__
pip install -r requirements.txt
```

**Tests failing:**
```bash
# Update snapshots
npm test -- -u

# Run specific test
npm test -- MyComponent.test.js

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Getting Help

- Check [Documentation](./docs/)
- Review [Examples](./examples/)
- Search [Issues](https://github.com/your-org/clippy-revival/issues)
- Ask in [Discussions](https://github.com/your-org/clippy-revival/discussions)

---

## Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Advanced Features Guide](./ADVANCED_FEATURES_GUIDE.md)

### External Resources
- [React Documentation](https://react.dev/)
- [Material-UI](https://mui.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Playwright Documentation](https://playwright.dev/)

---

## Next Steps

1. Read the [Architecture Guide](./ARCHITECTURE.md)
2. Review [Component Documentation](./COMPONENTS.md)
3. Try [Example Projects](../examples/)
4. Build your first feature
5. Submit a pull request

Welcome to the Clippy Revival development team! 🎉
