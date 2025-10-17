# Clippy Revival 🎯

A modern revival of Microsoft's Clippy assistant, powered by local AI and built for Windows.

## Features

- **AI-Powered Assistant**: Uses Ollama for local LLM processing - no cloud required
- **Customizable Characters**: Import custom character packs or use built-in ones
- **System Integration**: Monitor system resources, manage files, install software
- **Web Automation**: Browse the web and automate tasks with Playwright
- **Comprehensive Dashboard**: Control everything from a beautiful Material UI interface
- **Privacy First**: Everything runs locally on your machine

## Architecture

```
┌─────────────────────────────────────────┐
│          Electron Shell                 │
├────────────────┬────────────────────────┤
│  Tray Icon     │   Floating Buddy       │
│  Dashboard UI  │   Character Window      │
│  (React + MUI) │   (Always on Top)       │
└────────┬───────┴────────────────────────┘
         │ IPC / HTTP / WebSocket
┌────────▼─────────────────────────────────┐
│       Python Backend (FastAPI)           │
├──────────────────────────────────────────┤
│  • AI Service (Ollama Integration)       │
│  • File Operations Service               │
│  • System Monitoring Service             │
│  • Software Management Service           │
│  • Web Automation Service (Playwright)   │
└──────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Electron + React + Material UI
- **Backend**: Python + FastAPI
- **AI**: Ollama (local LLM)
- **Automation**: Playwright
- **Package Manager**: npm (frontend), pip (backend)
- **Build Tools**: Webpack, PyInstaller, electron-builder

## Development Setup

### Prerequisites

- Node.js v20 LTS (20.x) and npm v9+
- Python 3.12
- Ollama installed and running
- Git
- Windows 10/11

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd clippy-revival

# Install frontend dependencies
npm install

# Setup Python backend (requires Python 3.12)
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Start development servers
npm run dev
```

## Building for Distribution

```bash
# Build the complete application
npm run pack

# Output will be in build/Clippy-Revival-{version}-win.zip
```

## Project Structure

```
clippy-revival/
├── electron/           # Electron main process
│   ├── main.js        # App entry, window management
│   └── preload.js     # Secure IPC bridge
├── src/               # React frontend
│   ├── components/    # UI components
│   ├── pages/        # Dashboard pages
│   ├── services/     # API clients
│   └── assets/       # Static resources
├── backend/          # Python FastAPI backend
│   ├── app.py       # FastAPI entry point
│   ├── api/         # API endpoints
│   ├── services/    # Business logic
│   └── models/      # Pydantic schemas
├── characters/      # Character pack storage
├── scripts/        # Build and dev scripts
└── build/         # Distribution output
```

## Usage

### First Run

1. Launch the app - Clippy will appear in your system tray
2. Right-click the tray icon for quick actions:
   - **Show Dashboard** - Open the main control panel
   - **Show Buddy** - Toggle the floating character window
   - **Settings** - Configure AI model and preferences
   - **Quit** - Exit the application

### Character Packs

Import custom character packs to personalize your assistant:

1. Navigate to **Characters** page
2. Click **Import Pack** and select a .zip file
3. Preview animations in different states
4. Click **Set Active** to use the character

See [characters/README.md](characters/README.md) for creating custom packs.

### AI Chat

Interact with your AI assistant:

1. Open the dashboard chat interface
2. Type your question or command
3. Watch Clippy animate as the AI responds!
4. Character states automatically match context:
   - `think` - AI is processing
   - `speak` - AI is responding
   - `work` - Performing a task
   - `success` / `error` - Task completed

## Configuration

### Environment Variables

Optional `.env` file in project root:

```env
PORT=43110                          # Backend port
NODE_ENV=development                # Environment mode
OLLAMA_MODEL=llama3.2              # Default AI model
OLLAMA_HOST=http://localhost:11434 # Ollama server URL
```

### Settings

Configure via the Settings page:
- **AI Model Selection** - Choose from available Ollama models
- **Character Pack** - Set active character
- **System Permissions** - File and software access
- **Startup Behavior** - Launch on Windows startup
- **Logging** - Debug and diagnostic settings

## Troubleshooting

### Backend Connection Issues

**Symptom:** "Failed to connect to backend"

**Solutions:**
- Verify Python venv is activated: `.\backend\venv\Scripts\activate`
- Check port 43110 is not in use: `netstat -ano | findstr :43110`
- Manually start backend: `cd backend && python app.py`
- Review logs in `backend/logs/`

### Ollama Not Found

**Symptom:** "Cannot connect to Ollama service"

**Solutions:**
- Ensure Ollama is installed: `ollama --version`
- Start Ollama if not running
- Pull a model: `ollama pull llama3.2`
- Verify it's listening: `curl http://localhost:11434/api/version`

### Character Pack Import Failed

**Symptom:** "Invalid manifest" or "Validation error"

**Solutions:**
- Check `character.json` follows the schema (see [characters/character-schema.json](characters/character-schema.json))
- Ensure all referenced image files exist in the zip
- Validate using the **Validate** button in Characters page
- Check console for detailed error messages

### Build Errors

**Symptom:** `npm run pack` fails

**Solutions:**
- Clear build artifacts: `rm -rf dist build backend/dist`
- Rebuild frontend: `npm run build:renderer`
- Rebuild backend: `npm run build:backend`
- Check Python and Node versions match requirements
- Ensure PyInstaller is installed in venv

## Development

### Hot Reload

Development mode includes hot reload for both frontend and backend:

```bash
npm run dev
```

- Frontend changes auto-reload via webpack-dev-server
- Backend restarts on file changes (if uvicorn reload enabled)

### API Documentation

When backend is running, visit:

**Interactive API docs:** http://127.0.0.1:43110/docs

### Adding Features

1. **Backend Service** - Create in `backend/services/your_service.py`
2. **API Router** - Add routes in `backend/api/your_router.py`
3. **Frontend Component** - Create in `src/components/` or `src/pages/`
4. **State Management** - Update `src/store/appStore.js`
5. **Integration** - Wire up API calls and WebSocket events

### Testing

```powershell
# Backend tests
cd backend
pytest

# Frontend tests  
npm test

# Linting
npm run lint
```

## Security

- ✅ Renderer sandboxed (contextIsolation enabled)
- ✅ No Node.js in renderer (nodeIntegration disabled)
- ✅ Backend listens only on 127.0.0.1
- ✅ File operations restricted to safe directories
- ✅ Deletions use Recycle Bin by default
- ✅ No external tracking or telemetry
- ✅ All AI processing happens locally via Ollama

## Roadmap

**Current Version: 1.0.0**

### Completed ✅
- [x] Core architecture (Electron + React + FastAPI)
- [x] AI chat integration with Ollama
- [x] Character pack system with animations
- [x] System monitoring (CPU, RAM, disk, network)
- [x] File operations (list, move, delete)
- [x] Software management (winget integration)
- [x] Web automation (Playwright)
- [x] Agent orchestration with tool registry
- [x] Build and packaging scripts

### Planned 🚀
- [ ] Task scheduling and history
- [ ] Enhanced error handling and retry logic
- [ ] First-run onboarding flow
- [ ] Plugin system for extensibility
- [ ] Voice commands (TTS/STT)
- [ ] Knowledge base with local embeddings
- [ ] Cross-platform support (macOS, Linux)
- [ ] Performance optimizations

## Credits

- **Inspiration:** Microsoft's original Clippy (1997-2007)
- **Built with:** [Electron](https://electronjs.org), [React](https://react.dev), [FastAPI](https://fastapi.tiangolo.com)
- **AI powered by:** [Ollama](https://ollama.ai)
- **Icons:** Material Design Icons

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

**Made with ❤️ and nostalgia**

*"It looks like you're trying to build something awesome. Would you like help with that?"* 📎
