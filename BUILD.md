# Build Instructions

## Prerequisites

Before building, ensure you have:
- Node.js 24.6.0 or higher
- Python 3.13
- npm 11.5.1 or higher
- Git

## Development Setup

1. **Clone the repository** (if not already done)
```bash
git clone <your-repo-url>
cd clippy-revival
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Setup Python backend**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Development

### Run in Development Mode

Start both the frontend dev server and Electron:
```bash
npm run dev
```

This will:
- Start webpack dev server on http://localhost:5173
- Launch Electron app
- Automatically start Python backend on port 43110
- Enable hot reloading

### Test Backend Only

```bash
cd backend
.\venv\Scripts\activate
python app.py
```

Backend will be available at http://127.0.0.1:43110

### Test Frontend Only

```bash
npm run dev:renderer
```

Frontend will be available at http://localhost:5173

## Building for Production

### Quick Build (Recommended for Testing)

Build frontend and package without rebuilding backend:
```bash
npm run package:quick
```

### Full Build (Complete Package)

Build everything from scratch:
```bash
npm run package
```

Or use the PowerShell script directly:
```powershell
.\scripts\package.ps1
```

### Individual Components

**Build Frontend Only:**
```bash
npm run build:renderer
```
Output: `dist/` directory

**Build Backend Only:**
```bash
npm run build:backend
```
Output: `backend/dist/clippy-backend/` directory

**Package Electron App:**
```bash
npm run build:win
```
Output: `build/` directory with zip file

## Build Output

After a successful build, you'll find:
- **Frontend**: `dist/renderer.js` and `dist/index.html`
- **Backend**: `backend/dist/clippy-backend/clippy-backend.exe`
- **Final Package**: `build/Clippy Revival-1.0.0-win-x64.zip`

## Distribution

The final zip file contains:
- Electron application
- Bundled Python backend
- Default character pack
- All necessary dependencies

**To distribute:**
1. Locate the zip file in `build/`
2. Share the zip file with users
3. Users extract and run `Clippy Revival.exe`

## Troubleshooting

### Backend Build Fails

If PyInstaller fails:
1. Ensure Python virtual environment is activated
2. Install/update PyInstaller: `pip install --upgrade pyinstaller`
3. Check for missing dependencies in `requirements.txt`
4. Try cleaning build artifacts: `Remove-Item -Recurse -Force backend/dist, backend/build`

### Frontend Build Fails

If webpack fails:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and reinstall: `Remove-Item -Recurse -Force node_modules; npm install`
3. Check for syntax errors in React components

### Electron Builder Fails

If packaging fails:
1. Ensure both frontend and backend are built first
2. Check electron-builder configuration in `package.json`
3. Verify `backend/dist/clippy-backend/` exists with exe file
4. Try: `npx electron-builder --win zip --dir` for debugging

### Large Package Size

To reduce package size:
- Playwright browsers are ~170MB but downloaded on first use
- Backend exe is ~80-100MB with all dependencies
- Consider using `--onefile` PyInstaller mode (single exe, slower startup)

## Build Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development environment |
| `npm run dev:renderer` | Start webpack dev server only |
| `npm run dev:electron` | Start Electron only (dev mode) |
| `npm run build:renderer` | Build frontend for production |
| `npm run build:backend` | Build backend executable |
| `npm run build:win` | Package Electron app (no backend) |
| `npm run pack` | Build everything and package |
| `npm run package` | Full build with PowerShell script |
| `npm run package:quick` | Package without rebuilding backend |

## Clean Build

To start fresh:
```powershell
# Clean all build artifacts
Remove-Item -Recurse -Force dist, build, backend/dist, backend/build, node_modules
npm install
npm run package
```

## Notes

- Backend runs on port 43110 (configurable in `backend/app.py`)
- Frontend dev server runs on port 5173
- Build time: ~2-5 minutes depending on system
- Final package size: ~200-300MB
- First run downloads Playwright browsers if needed (~170MB)