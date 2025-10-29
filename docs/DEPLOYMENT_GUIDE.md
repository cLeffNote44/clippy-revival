# Deployment Guide

Complete guide for building, packaging, and deploying Clippy Revival.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building for Production](#building-for-production)
3. [Packaging](#packaging)
4. [Distribution](#distribution)
5. [Updates](#updates)
6. [CI/CD](#cicd)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Development Tools

- **Node.js**: 20 LTS or higher
- **Python**: 3.12 or higher
- **Git**: Latest version
- **Build Tools**: Platform-specific (see below)

### Platform-Specific Requirements

**Windows:**
```bash
# Install Visual Studio Build Tools
choco install visualstudio2022buildtools
choco install visualstudio2022-workload-vctools

# Or download from:
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install certificates for code signing
# Required for App Store distribution
```

**Linux:**
```bash
# Debian/Ubuntu
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf install @development-tools

# Arch
sudo pacman -S base-devel
```

---

## Building for Production

### 1. Clean Build Environment

```bash
# Remove old builds
npm run clean

# Remove node_modules
rm -rf node_modules
rm -rf backend/venv

# Fresh install
npm install
cd backend && pip install -r requirements.txt
```

### 2. Run Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend && pytest

# E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

### 3. Build Frontend

```bash
# Production build with optimizations
npm run build:renderer

# Output: dist/renderer/
# - bundle.js (main JavaScript)
# - styles.css (compiled CSS)
# - index.html (entry point)
# - assets/ (images, fonts, etc.)
```

### 4. Build Electron

```bash
# Build main process
npm run build:electron

# Output: dist/electron/
# - main.js (main process)
# - preload.js (preload script)
```

### 5. Prepare Backend

```bash
# Create Python requirements
cd backend
pip freeze > requirements-frozen.txt

# Copy backend files to dist
mkdir -p ../dist/backend
cp -r *.py services/ middleware/ models/ requirements.txt ../dist/backend/
```

### 6. Full Production Build

```bash
# Single command for full build
npm run build

# This runs:
# 1. npm run build:renderer
# 2. npm run build:electron
# 3. Backend preparation
# 4. Asset optimization
```

---

## Packaging

### Windows Packaging

#### NSIS Installer

```bash
# Build Windows installer
npm run package:win

# Output: release/Clippy Revival Setup 1.0.0.exe
```

**Configuration (package.json):**
```json
{
  "build": {
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon.ico",
      "publisherName": "Clippy Revival Team",
      "verifyUpdateCodeSignature": false
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "license": "LICENSE",
      "installerIcon": "assets/icon.ico",
      "uninstallerIcon": "assets/icon.ico"
    }
  }
}
```

#### Portable Version

```bash
# Build portable (no installer)
npm run package:win -- --config.win.target=portable

# Output: release/Clippy Revival 1.0.0.exe (portable)
```

#### MSI Installer

```bash
# Build MSI (for enterprise deployment)
npm run package:win -- --config.win.target=msi

# Requires WiX Toolset
# Install: choco install wixtoolset
```

### macOS Packaging

#### DMG Package

```bash
# Build macOS DMG
npm run package:mac

# Output: release/Clippy Revival-1.0.0.dmg
```

**Configuration:**
```json
{
  "build": {
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "assets/icon.icns",
      "category": "public.app-category.productivity",
      "darkModeSupport": true,
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

#### App Store Package

```bash
# Build for App Store
npm run package:mac -- --config.mac.target=mas

# Requires:
# - Apple Developer account
# - Distribution certificate
# - App-specific password
```

**Code Signing:**
```bash
# Sign the app
codesign --deep --force --verbose --sign "Developer ID Application: Your Name" \
  "release/mac/Clippy Revival.app"

# Verify signature
codesign --verify --verbose=4 "release/mac/Clippy Revival.app"
spctl --assess --verbose=4 "release/mac/Clippy Revival.app"
```

### Linux Packaging

#### AppImage

```bash
# Build AppImage
npm run package:linux -- --config.linux.target=AppImage

# Output: release/Clippy Revival-1.0.0.AppImage
```

#### Snap

```bash
# Build Snap package
npm run package:linux -- --config.linux.target=snap

# Publish to Snap Store
snapcraft login
snapcraft push release/clippy-revival_1.0.0_amd64.snap --release=stable
```

#### Debian Package

```bash
# Build .deb package
npm run package:linux -- --config.linux.target=deb

# Output: release/clippy-revival_1.0.0_amd64.deb

# Install
sudo dpkg -i release/clippy-revival_1.0.0_amd64.deb
```

#### RPM Package

```bash
# Build RPM package
npm run package:linux -- --config.linux.target=rpm

# Output: release/clippy-revival-1.0.0.x86_64.rpm

# Install
sudo rpm -i release/clippy-revival-1.0.0.x86_64.rpm
```

---

## Distribution

### GitHub Releases

#### 1. Create Release

```bash
# Tag version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 \
  --title "Clippy Revival v1.0.0" \
  --notes "Release notes here..." \
  release/*.exe \
  release/*.dmg \
  release/*.AppImage \
  release/*.deb
```

#### 2. Release Notes Template

```markdown
## Clippy Revival v1.0.0

### 🎉 New Features
- Feature 1
- Feature 2

### 🐛 Bug Fixes
- Fix 1
- Fix 2

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 📦 Downloads
- Windows: `Clippy-Revival-Setup-1.0.0.exe`
- macOS: `Clippy-Revival-1.0.0.dmg`
- Linux: `Clippy-Revival-1.0.0.AppImage`

### 📝 Installation Instructions
See [Installation Guide](docs/INSTALLATION.md)

### ⚠️ Breaking Changes
- None

### 📊 Checksums
SHA256 checksums:
- Windows: `abc123...`
- macOS: `def456...`
- Linux: `ghi789...`
```

### Microsoft Store

#### 1. Prepare Package

```bash
# Build Windows Store package
npm run package:win -- --config.win.target=appx

# Output: release/Clippy Revival-1.0.0.appx
```

#### 2. Create App Listing

1. Go to [Partner Center](https://partner.microsoft.com/dashboard)
2. Create new app submission
3. Upload .appx package
4. Fill in app details (description, screenshots, etc.)
5. Submit for certification

### Mac App Store

#### 1. Prepare Package

```bash
# Build for App Store
npm run package:mac -- --config.mac.target=mas

# Sign package
electron-osx-sign "release/mas/Clippy Revival.app" \
  --identity="3rd Party Mac Developer Application: Your Name" \
  --entitlements=build/entitlements.mas.plist \
  --entitlements-inherit=build/entitlements.mas.inherit.plist

# Create .pkg
electron-installer-dmg "release/mas/Clippy Revival.app" \
  "Clippy Revival" \
  --out=release \
  --overwrite
```

#### 2. Submit to App Store

```bash
# Upload to App Store Connect
xcrun altool --upload-app \
  --type osx \
  --file "release/Clippy Revival.pkg" \
  --username "your@email.com" \
  --password "@keychain:AC_PASSWORD"
```

### Snap Store

```bash
# Login to Snap Store
snapcraft login

# Upload snap
snapcraft upload release/clippy-revival_1.0.0_amd64.snap

# Release to channel
snapcraft release clippy-revival 1.0.0 stable
```

---

## Updates

### Auto-Updates

Clippy Revival uses `electron-updater` for automatic updates.

#### 1. Configure Updates

```json
// package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-org",
      "repo": "clippy-revival",
      "releaseType": "release"
    }
  }
}
```

#### 2. Implement Update Logic

```javascript
// electron/main.js
const { autoUpdater } = require('electron-updater');

// Check for updates on startup
app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Update events
autoUpdater.on('update-available', () => {
  // Notify user
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. It will be downloaded in the background.',
  });
});

autoUpdater.on('update-downloaded', () => {
  // Prompt to install
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. Restart to install?',
    buttons: ['Restart', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
```

#### 3. Update Server

Updates are served from GitHub Releases automatically.

**Manual update server:**
```javascript
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-server.com/updates"
    }
  }
}
```

---

## CI/CD

### GitHub Actions

#### Build Workflow

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          npm install
          cd backend && pip install -r requirements.txt

      - name: Run tests
        run: |
          npm test
          cd backend && pytest

      - name: Build
        run: npm run build

      - name: Package
        run: npm run package

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: release-${{ matrix.os }}
          path: release/
```

#### Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build all platforms
        run: |
          npm run package:win
          npm run package:mac
          npm run package:linux

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            release/*.exe
            release/*.dmg
            release/*.AppImage
            release/*.deb
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm install
    - npm test
    - cd backend && pytest

build:
  stage: build
  script:
    - npm run build
    - npm run package
  artifacts:
    paths:
      - release/

deploy:
  stage: deploy
  only:
    - tags
  script:
    - ./scripts/deploy.sh
```

---

## Troubleshooting

### Build Issues

**Node version mismatch:**
```bash
# Use correct Node version
nvm use 20

# Or install correct version
nvm install 20
nvm use 20
```

**Python dependencies fail:**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with --no-cache
pip install --no-cache-dir -r requirements.txt
```

**Native modules fail:**
```bash
# Rebuild native modules
npm run rebuild

# Or manually
./node_modules/.bin/electron-rebuild
```

### Packaging Issues

**Code signing fails (macOS):**
```bash
# List available identities
security find-identity -v -p codesigning

# Set correct identity in environment
export CSC_NAME="Developer ID Application: Your Name"

# Or disable signing (dev only)
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

**Icon not showing:**
```bash
# Verify icon exists and has correct format
# Windows: .ico (multi-resolution)
# macOS: .icns
# Linux: .png (512x512)

# Convert using ImageMagick
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

**Build fails on CI:**
```bash
# Enable debug logging
DEBUG=electron-builder npm run package

# Check CI logs for specific errors
# Common issues:
# - Missing build tools
# - Insufficient memory
# - Network timeouts
```

### Update Issues

**Updates not detected:**
```bash
# Check update server is reachable
curl -I https://api.github.com/repos/your-org/clippy-revival/releases/latest

# Verify publish configuration in package.json
# Check electron-updater logs
```

**Update download fails:**
```bash
# Clear update cache
rm -rf ~/Library/Caches/clippy-revival-updater  # macOS
rm -rf %LOCALAPPDATA%\clippy-revival-updater    # Windows
rm -rf ~/.cache/clippy-revival-updater          # Linux
```

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Version number updated in package.json
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Icons generated for all platforms
- [ ] Code signed (macOS/Windows)
- [ ] Release notes written
- [ ] Security scan completed
- [ ] Performance tested
- [ ] Accessibility verified
- [ ] Packages built for all platforms
- [ ] Checksums generated
- [ ] GitHub release created
- [ ] Update server configured
- [ ] Monitoring alerts configured

---

## Resources

- [Electron Builder Docs](https://www.electron.build/)
- [Electron Updater](https://www.electron.build/auto-update)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Publishing Guide](https://www.electronjs.org/docs/latest/tutorial/publishing-updates)

---

## Support

For deployment issues:
- Check [Troubleshooting](#troubleshooting)
- Search [GitHub Issues](https://github.com/your-org/clippy-revival/issues)
- Ask in [Discussions](https://github.com/your-org/clippy-revival/discussions)
