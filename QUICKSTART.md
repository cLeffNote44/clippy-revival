# Clippy Revival - Quick Start Guide

Get Clippy Revival running in 5 minutes!

## Prerequisites Check

Run this command to verify you have everything:

```powershell
.\scripts\validate-milestone.ps1
```

If you're missing anything, install these tools:

- **Node.js 20+**: https://nodejs.org/
- **Python 3.10-3.12**: https://python.org/
- **Ollama**: https://ollama.ai/

## Step 1: Clone and Install (2 minutes)

```powershell
# Clone the repository (if not already done)
git clone <repository-url>
cd clippy-revival

# Install Node dependencies
npm install

# Setup Python environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

## Step 2: Pull AI Model (1 minute)

```powershell
# Pull a small, fast model
ollama pull llama3.2

# Or for better quality (larger):
ollama pull llama3.2:13b
```

## Step 3: Run Development Mode (30 seconds)

```powershell
npm run dev
```

This will:
- ✅ Start webpack dev server (http://localhost:5173)
- ✅ Launch Electron with hot reload
- ✅ Spawn Python backend (http://127.0.0.1:43110)
- ✅ Show Clippy in your system tray

## Step 4: Test Features (1 minute)

### 1. View System Metrics
- Right-click tray icon → **Show Dashboard**
- You should see real-time CPU, RAM, disk stats

### 2. Test AI Chat
- In dashboard, open chat interface
- Type: "Hello, who are you?"
- Watch Clippy animate while AI responds!

### 3. Manage Characters
- Click **Characters** in sidebar
- Preview animation states
- Import custom character packs (optional)

### 4. Toggle Buddy Window
- Right-click tray → **Show Buddy**
- Drag the floating Clippy around
- Double-click to enable click-through mode

## Common Issues & Fixes

### "Failed to connect to backend"
```powershell
# Check if port is available
netstat -ano | findstr :43110

# Manually start backend
cd backend
.\venv\Scripts\Activate.ps1
python app.py
```

### "Ollama connection error"
```powershell
# Verify Ollama is running
ollama list

# Start Ollama service if needed
ollama serve
```

### "Module not found" errors
```powershell
# Reinstall dependencies
npm install
cd backend
pip install -r requirements.txt
```

## Development Workflow

### Hot Reload
Changes auto-reload:
- **Frontend** (React): Edit `src/` files, see changes instantly
- **Backend** (Python): Edit `backend/` files, backend restarts automatically

### View Logs
- **Backend logs**: Check console where you ran `npm run dev`
- **Frontend logs**: Open DevTools in Electron (Ctrl+Shift+I)

### Test Backend API
Visit **http://127.0.0.1:43110/docs** for interactive API documentation

## Build for Production

```powershell
# Build everything and package as ZIP
npm run pack

# Output: build/Clippy-Revival-1.0.0-win.zip
```

## Project Structure Quick Reference

```
clippy-revival/
├── electron/           # Electron main process
│   ├── main.js        # App lifecycle, windows, tray
│   └── preload.js     # Secure IPC bridge
├── src/               # React frontend
│   ├── components/    # Reusable UI components
│   ├── pages/         # Dashboard, Characters, Settings
│   ├── store/         # Zustand state management
│   └── App.js         # Root component with routing
├── backend/           # Python FastAPI backend
│   ├── api/           # API route handlers
│   ├── services/      # Business logic (AI, files, etc.)
│   └── app.py         # Main FastAPI application
├── characters/        # Character pack storage
│   ├── clippy-classic/
│   └── character-schema.json
└── scripts/           # Build and validation scripts
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/store/appStore.js` | Global state (chat, metrics, character state) |
| `backend/app.py` | Backend entry point, API routes |
| `electron/main.js` | Window management, backend spawning |
| `src/pages/Dashboard.js` | Main UI dashboard |
| `backend/services/ollama_service.py` | AI chat integration |
| `backend/services/agent_service.py` | Tool orchestration |

## Next Steps

### Add Your Own Character
1. Create a folder in `characters/my-character/`
2. Add `character.json` manifest
3. Add animation frames in `assets/`
4. Import via Characters page

See [characters/README.md](characters/README.md) for detailed instructions.

### Customize AI Behavior
1. Edit system prompt in `backend/services/ollama_service.py`
2. Add new tools in `backend/services/agent_service.py`
3. Register tools in the tool registry

### Add a New Feature
1. **Backend**: Create service in `backend/services/your_feature.py`
2. **API**: Add router in `backend/api/your_feature_router.py`
3. **Frontend**: Create component in `src/components/YourFeature.js`
4. **State**: Update `src/store/appStore.js`

## Resources

- **README.md** - Full installation and usage guide
- **ARCHITECTURE.md** - Technical design and data flow
- **BUILD.md** - Build and packaging instructions
- **API Docs** - http://127.0.0.1:43110/docs (when running)

## Getting Help

### Check Validation
```powershell
.\scripts\validate-milestone.ps1
```

### View Backend Health
```powershell
curl http://127.0.0.1:43110/health
```

### Common Commands
```powershell
npm run dev          # Start development mode
npm run build        # Build frontend only
npm run pack         # Build and package everything
npm test             # Run tests
npm run lint         # Check code style
```

## Tips & Tricks

1. **Fast Iteration**: Keep `npm run dev` running, edit files, see changes instantly
2. **Debug Backend**: Add `import pdb; pdb.set_trace()` for breakpoints
3. **Debug Frontend**: Use React DevTools extension in Electron
4. **Test AI Without UI**: Use `curl` or the API docs at `/docs`
5. **Character Preview**: Use Characters page preview before activating

## Contributing

Want to contribute? Great!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `.\scripts\validate-milestone.ps1`
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

**Happy Coding! 📎**

*Remember: "It looks like you're trying to write code. Would you like help with that?"*
