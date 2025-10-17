# Clippy Revival Architecture

This document describes the technical architecture and design decisions for Clippy Revival.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Security Model](#security-model)
5. [Communication Protocols](#communication-protocols)
6. [State Management](#state-management)
7. [Build and Packaging](#build-and-packaging)

## System Overview

Clippy Revival is a desktop application built with a hybrid architecture:

```
┌─────────────────────────────────────────────────┐
│           Electron Process (Node.js)            │
│  ┌───────────────┐       ┌──────────────────┐  │
│  │  Main Process │       │  Renderer Process │  │
│  │  (electron/)  │◄─IPC─►│     (React)      │  │
│  │               │       │   Sandboxed      │  │
│  └───────┬───────┘       └──────────────────┘  │
└──────────┼─────────────────────────────────────┘
           │ HTTP/WS
           ▼
┌──────────────────────────────────────────────────┐
│       Python Backend (FastAPI + uvicorn)         │
│  ┌────────────────────────────────────────────┐  │
│  │  REST API + WebSocket Server               │  │
│  │  (127.0.0.1:43110)                        │  │
│  └────────────┬───────────────────────────────┘  │
│               ▼                                   │
│  ┌────────────────────────────────────────────┐  │
│  │           Service Layer                    │  │
│  │  • AI (Ollama)    • System Monitoring     │  │
│  │  • Files          • Software (winget)      │  │
│  │  • Web (Playwright) • Characters          │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns** - UI, business logic, and system operations are isolated
2. **Security by Default** - Renderer sandboxed, operations require explicit user consent
3. **Local-First** - All processing happens on-device; no cloud dependencies
4. **Extensibility** - Plugin-friendly architecture with character packs and tool registry
5. **Performance** - Async operations, WebSocket streaming, and efficient state management

## Component Architecture

### Electron Layer

#### Main Process (`electron/main.js`)

**Responsibilities:**
- Application lifecycle management
- Window creation and orchestration
- System tray integration
- Backend process spawning and monitoring
- IPC message routing

**Key Features:**
- Single instance lock (prevents multiple app instances)
- Graceful shutdown with cleanup
- Window state persistence
- Backend health monitoring with auto-restart

#### Preload Script (`electron/preload.js`)

**Purpose:** Secure bridge between renderer and main process

**Exposed APIs (via contextBridge):**
```javascript
window.electronAPI = {
  // Backend communication
  getBackendUrl() -> Promise<string>
  connectWebSocket(path) -> WebSocket
  
  // Window controls
  showBuddyWindow()
  showDashboard()
  setBuddyClickThrough(enabled)
  
  // Navigation
  onNavigate(callback)
  onAssistantPaused(callback)
}
```

**Security:**
- No Node.js APIs exposed to renderer
- All system operations proxied through main process
- Input validation on all IPC messages

#### Windows

**Dashboard Window:**
- Standard window with frame
- Size: 1200×800 (configurable)
- Minimum size: 800×600
- Loads React app (`/dashboard` route)

**Buddy Window:**
- Frameless, transparent window
- Always on top
- Size: 150×150 (adapts to character)
- Draggable via custom drag region
- Double-click to toggle click-through
- Loads React app (`/buddy` route)

### Frontend Layer

#### Tech Stack

- **React 18** - UI framework with hooks
- **Material-UI v5** - Component library
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Navigation

#### Project Structure

```
src/
├── App.js              # Root component, routing
├── index.js            # Entry point
├── components/         # Reusable UI components
│   ├── CharacterAvatar.js
│   └── ChatInterface.js
├── pages/              # Route pages
│   ├── Dashboard.js
│   ├── Characters.js
│   ├── Settings.js
│   └── BuddyWindow.js
├── store/              # State management
│   └── appStore.js     # Zustand store
└── services/           # API clients
    └── api.js
```

#### State Management

**Global Store (Zustand):**

```javascript
{
  // Connection
  backendUrl: string
  isConnected: boolean
  websocket: WebSocket | null
  
  // Assistant
  assistantPaused: boolean
  characterState: 'idle' | 'think' | 'speak' | 'work' | 'success' | 'error'
  
  // System
  systemMetrics: { cpu, memory, disk, network }
  
  // Chat
  chatHistory: Message[]
  isTyping: boolean
  
  // Actions
  initializeBackend()
  sendMessage(text)
  setCharacterState(state)
}
```

**State Updates:**
- HTTP responses update synchronously
- WebSocket messages update reactively
- Character state transitions automated based on events

### Backend Layer

#### Tech Stack

- **FastAPI** - Web framework
- **uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Ollama** - AI inference
- **Playwright** - Browser automation
- **psutil** - System metrics

#### Project Structure

```
backend/
├── app.py              # FastAPI app, startup/shutdown
├── api/                # Route handlers
│   ├── ai_router.py
│   ├── system_router.py
│   ├── files_router.py
│   ├── software_router.py
│   ├── web_router.py
│   └── characters.py
├── services/           # Business logic
│   ├── ollama_service.py
│   ├── agent_service.py
│   ├── files_service.py
│   ├── system_service.py
│   ├── software_service.py
│   ├── web_service.py
│   ├── character_service.py
│   └── websocket_manager.py
└── models/             # Pydantic schemas
    └── schemas.py
```

#### Service Layer

**AI Service (`ollama_service.py`):**
- Manages Ollama client connection
- Handles chat sessions with memory
- Streams responses via WebSocket
- Extracts tool calls from LLM output

**Agent Service (`agent_service.py`):**
- Tool registry and orchestration
- Action validation and execution
- User confirmation flow for dangerous operations
- Result summarization

**File Service (`files_service.py`):**
- Safe file operations (move, copy, delete)
- Path validation and normalization
- Recycle Bin integration via `send2trash`
- Dry-run preview mode

**System Service (`system_service.py`):**
- Real-time metrics collection (CPU, RAM, disk, network)
- Background monitoring with WebSocket streaming
- Cleanup tasks (temp files, caches)

**Software Service (`software_service.py`):**
- winget integration for package management
- Process output streaming
- Installed software detection

**Web Service (`web_service.py`):**
- Playwright browser automation
- Session management
- Step-by-step recipe execution

**Character Service (`character_service.py`):**
- Character pack discovery and loading
- ZIP import with validation
- Manifest schema validation (JSON Schema)

## Data Flow

### Startup Sequence

```
1. User launches Clippy Revival.exe
   ↓
2. Electron main process starts
   ↓
3. Main checks for running backend (port 43110)
   ↓
4. If not found, spawn backend process
   - Dev: python backend/app.py
   - Prod: backend.exe from extraResources
   ↓
5. Wait for backend health check (/health)
   ↓
6. Create system tray icon
   ↓
7. Create BuddyWindow (hidden initially)
   ↓
8. Show BuddyWindow with idle animation
   ↓
9. Renderer connects WebSocket to backend
   ↓
10. Subscribe to events (metrics, AI responses)
```

### AI Chat Flow

```
User types message in dashboard
   ↓
Frontend: Add to chatHistory, set characterState='think'
   ↓
POST /ai/chat { message, sessionId }
   ↓
Backend: OllamaService.generate()
   ↓
Backend: Stream tokens via WebSocket
   ↓
Frontend: Receive tokens, display progressively
   ↓
Frontend: Set characterState='speak'
   ↓
Backend: Detect tool call in response
   ↓
Backend: Execute tool via AgentService
   ↓
Backend: Send result via WebSocket
   ↓
Frontend: Update chatHistory, set characterState='success'
   ↓
After 3s: Return to 'idle'
```

### Character Pack Import Flow

```
User clicks "Import Pack", selects .zip
   ↓
POST /characters/import (multipart/form-data)
   ↓
Backend: Save to temp location
   ↓
Backend: Extract ZIP
   ↓
Backend: Locate character.json
   ↓
Backend: Validate against JSON Schema
   ↓
Backend: Check for duplicate ID
   ↓
Backend: Move to characters/{id}/
   ↓
Backend: Return { success, pack_id }
   ↓
Frontend: Reload pack list
   ↓
Frontend: Show success message
```

### System Monitoring Flow

```
Backend startup: SystemService.start_monitoring()
   ↓
Every 2 seconds:
   ├─ Collect CPU usage (psutil)
   ├─ Collect memory stats (psutil)
   ├─ Collect disk usage (psutil)
   └─ Collect network I/O (psutil)
   ↓
Broadcast via WebSocket { type: 'system.metrics', payload }
   ↓
Frontend: Receive event
   ↓
Frontend: Update appStore.systemMetrics
   ↓
Frontend: Charts re-render with new data
```

## Security Model

### Electron Security

**Renderer Isolation:**
```javascript
// Main process window config
{
  webPreferences: {
    contextIsolation: true,    // Separate contexts
    nodeIntegration: false,     // No Node.js in renderer
    sandbox: true,              // OS-level sandbox
    preload: './preload.js'     // Controlled bridge
  }
}
```

**Content Security Policy:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline';
               connect-src 'self' ws://127.0.0.1:*">
```

### Backend Security

**Network Binding:**
- Listen only on `127.0.0.1` (localhost)
- No external network exposure
- Optional token-based auth for additional security

**File Operations:**
- Path validation against allowlist
- Canonicalization to prevent traversal
- Default to Recycle Bin for deletions
- Confirmation required for permanent deletions

**Process Execution:**
- Whitelist of allowed commands (winget, etc.)
- No shell=True unless explicitly needed
- Subprocess timeout to prevent hangs
- Output sanitization

### Data Privacy

- No telemetry or analytics
- No external API calls (except Ollama on localhost)
- All AI processing local via Ollama
- User data never leaves the machine
- Logs stored locally with rotation

## Communication Protocols

### HTTP REST API

**Base URL:** `http://127.0.0.1:43110`

**Common Headers:**
```
Content-Type: application/json
```

**Error Format:**
```json
{
  "detail": "Error description",
  "status_code": 400
}
```

### WebSocket Protocol

**Endpoint:** `ws://127.0.0.1:43110/ws`

**Message Format:**
```json
{
  "type": "event.type",
  "payload": { ... }
}
```

**Event Types:**
- `system.metrics` - Real-time system stats
- `ai.response` - AI message chunk
- `ai.streaming` - Token streaming in progress
- `ai.typing` - AI thinking indicator
- `task.started` - Task execution started
- `task.progress` - Task progress update
- `task.success` - Task completed successfully
- `task.error` - Task failed

**Subscription:**
```json
{
  "type": "subscribe",
  "events": ["system.metrics", "ai.response"]
}
```

## State Management

### Character State Machine

```
      ┌──────────────────────┐
      │        idle          │◄───────┐
      └─────┬────────────────┘        │
            │                         │
   User msg │                    timeout (3s)
            ▼                         │
      ┌──────────────────────┐        │
      │       think          │        │
      └─────┬────────────────┘        │
            │                         │
   AI reply │                         │
            ▼                         │
      ┌──────────────────────┐        │
      │       speak          ├────────┘
      └──────────────────────┘
            
   Tool call                Task done
      ┌──────────────────────┐        ┌──────────────────────┐
      │        work          │───────►│ success / error      │
      └──────────────────────┘        └─────┬────────────────┘
                                            │
                                       timeout (2-3s)
                                            │
                                            ▼
                                      Back to idle
```

### Connection State

```
Disconnected ──startup──► Connecting ──success──► Connected
     ▲                                                │
     │                                                │
     └────────────────── error ──────────────────────┘
                        (retry after 5s)
```

## Build and Packaging

### Development Build

```
npm run dev
├─ webpack-dev-server (port 5173)
│  └─ Hot reload enabled
├─ Electron (DEV mode)
│  └─ Loads from localhost:5173
└─ Python backend
   └─ Spawned from venv
```

### Production Build

```
npm run pack
├─ Webpack production build
│  └─ Output: dist/ (HTML, JS, CSS)
├─ PyInstaller
│  └─ Output: backend/dist/backend.exe
└─ electron-builder
   ├─ Bundle dist/ as asar
   ├─ Copy backend.exe to extraResources
   ├─ Copy characters/ to extraResources
   └─ Output: build/Clippy-Revival-{version}-win.zip
```

### Distribution Structure

```
Clippy-Revival/
├── Clippy Revival.exe         # Electron executable
├── resources/
│   ├── app.asar              # Frontend bundle
│   ├── backend.exe           # Python backend
│   └── characters/           # Character packs
└── [Other Electron files]
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Character packs loaded on-demand
   - Playwright browsers installed when first used

2. **Efficient Rendering**
   - React.memo for expensive components
   - Virtualization for large lists
   - Debounced state updates

3. **Background Processing**
   - System metrics collected in separate thread
   - AI inference streams incrementally
   - File operations use async I/O

4. **Resource Management**
   - WebSocket connection pooling
   - Ollama model caching
   - Image preloading for character animations

### Memory Usage

**Target Footprint:**
- Electron + React: ~150-200 MB
- Python backend: ~100-150 MB
- Ollama (llama3.2): ~2-4 GB (separate process)

**Total:** ~300-400 MB + Ollama

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-17  
**Maintained By:** Clippy Revival Team
