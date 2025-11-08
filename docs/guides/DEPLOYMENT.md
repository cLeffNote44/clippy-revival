# Clippy Revival - Production Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-08

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Build Process](#build-process)
4. [Deployment](#deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### System Requirements
- **OS:** Windows 10/11 (x64)
- **RAM:** Minimum 8GB, Recommended 16GB
- **Disk:** 2GB free space (minimum), 10GB recommended
- **Network:** Internet connection for initial setup

### Software Requirements
- **Node.js:** v20 LTS (20.x)
- **Python:** 3.12.0 or higher (but below 3.14)
- **Ollama:** Latest version with at least one model pulled
- **Git:** For version control (optional but recommended)

### Required Ollama Models
```bash
# Recommended: llama3.2 (fast, efficient)
ollama pull llama3.2

# Alternative: mistral (good balance)
ollama pull mistral

# For coding: codellama
ollama pull codellama
```

---

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing (`npm test` and `npm run test:backend`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] Python code linted (`npm run lint:python`)

### 2. Security
- [ ] Run security audit (`npm audit`)
- [ ] Run backend security check (`pip-audit -r backend/requirements.txt`)
- [ ] Review environment variables in `.env`
- [ ] No sensitive data in repository
- [ ] HTTPS enabled if exposing externally (not recommended)

### 3. Configuration
- [ ] Update version number in `package.json`
- [ ] Update changelog in `CHANGELOG.md`
- [ ] Review and update `README.md`
- [ ] Set appropriate log levels

### 4. Dependencies
- [ ] Dependencies up to date
- [ ] No deprecated packages
- [ ] License compliance verified

---

## Build Process

### Step 1: Clean Build Environment
```powershell
# Clean previous builds
Remove-Item -Recurse -Force dist, build, backend/dist -ErrorAction SilentlyContinue

# Clean node_modules if needed
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

### Step 2: Build Frontend
```powershell
npm run build:renderer
```

**Expected Output:**
- `dist/` directory with bundled JavaScript, HTML, and assets
- Build size should be < 5MB (excluding node_modules)

### Step 3: Build Backend
```powershell
npm run build:backend
```

**Expected Output:**
- `backend/dist/clippy-backend/` directory
- Executable: `backend/dist/clippy-backend/clippy-backend.exe`
- Size should be < 100MB

### Step 4: Package Application
```powershell
npm run pack
```

**Expected Output:**
- `build/Clippy-Revival-{version}-win-x64.zip`
- Total package size: ~150-200MB

### Build Verification
```powershell
# Verify all files exist
Test-Path "dist/index.html"
Test-Path "backend/dist/clippy-backend/clippy-backend.exe"
Test-Path "build/Clippy-Revival-*.zip"
```

---

## Deployment

### Method 1: ZIP Distribution (Recommended)

#### For End Users:
1. Extract `Clippy-Revival-{version}-win-x64.zip`
2. Run `Clippy Revival.exe`
3. Complete first-run setup

#### For IT Deployment:
```powershell
# Silent installation script
$installPath = "C:\Program Files\Clippy Revival"
Expand-Archive -Path "Clippy-Revival-1.0.0-win-x64.zip" -DestinationPath $installPath

# Create desktop shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\Clippy Revival.lnk")
$Shortcut.TargetPath = "$installPath\Clippy Revival.exe"
$Shortcut.Save()

# Start application
Start-Process "$installPath\Clippy Revival.exe"
```

### Method 2: Development Deployment

For testing and development:
```powershell
# Start in development mode
npm run dev

# Or run separately
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
python app.py

# Terminal 2: Frontend
npm run dev:renderer

# Terminal 3: Electron
npm run dev:electron
```

---

## Post-Deployment Verification

### Health Checks

#### 1. Backend Health Check
```powershell
# Basic health
Invoke-RestMethod -Uri "http://127.0.0.1:43110/health"
# Expected: {"status":"healthy","timestamp":"..."}

# Detailed health
Invoke-RestMethod -Uri "http://127.0.0.1:43110/health/detailed"
# Expected: JSON with system metrics

# Readiness check
Invoke-RestMethod -Uri "http://127.0.0.1:43110/health/ready"
# Expected: {"status":"ready","timestamp":"..."}
```

#### 2. Frontend Load Test
1. Open application
2. Navigate to Dashboard
3. Navigate to Settings
4. Navigate to Characters
5. Navigate to Scheduler
6. All pages should load within 3 seconds

#### 3. Database Check
```powershell
# Check database file exists
Test-Path "backend/data/conversations.db"

# Should return True
```

#### 4. Ollama Integration
```powershell
# Test Ollama is accessible
Invoke-RestMethod -Uri "http://localhost:11434/api/version"
# Expected: {"version":"..."}
```

### Smoke Tests

Run comprehensive smoke tests:
```powershell
# Run E2E tests
npm run test:e2e

# Expected: All critical paths passing
```

### Performance Baseline

Monitor these metrics:
- **Startup Time:** < 5 seconds
- **Dashboard Load:** < 2 seconds
- **Memory Usage:** < 300MB (idle)
- **CPU Usage:** < 5% (idle)

---

## Monitoring & Maintenance

### Log Files

Logs are stored in:
- **Backend:** `backend/logs/clippy.log`
- **Errors:** `backend/logs/clippy_errors.log`
- **Database:** `backend/data/conversations.db`

### Log Rotation

Logs automatically rotate:
- **Max Size:** 10MB per file
- **Backups:** 5 files kept
- **Format:** Text (default) or JSON

### Monitoring Endpoints

```powershell
# Prometheus metrics
Invoke-RestMethod -Uri "http://127.0.0.1:43110/health/metrics/prometheus"

# System metrics
Invoke-RestMethod -Uri "http://127.0.0.1:43110/system/metrics"
```

### Scheduled Maintenance

**Daily:**
- Review error logs
- Check disk space

**Weekly:**
- Clean old conversation history (30+ days)
- Review system metrics trends
- Check for Ollama updates

**Monthly:**
- Update dependencies
- Review and archive logs
- Performance analysis

### Cleanup Old Data
```powershell
# Clean old conversations (via API)
Invoke-RestMethod -Uri "http://127.0.0.1:43110/api/conversations/cleanup?days=30" -Method Post
```

---

## Troubleshooting

### Issue: Application Won't Start

**Symptoms:** Application crashes immediately or doesn't open

**Solutions:**
1. Check if port 43110 is available:
   ```powershell
   netstat -ano | findstr :43110
   ```
2. Check Ollama is running:
   ```powershell
   ollama list
   ```
3. Check logs:
   ```powershell
   Get-Content backend/logs/clippy_errors.log -Tail 50
   ```

### Issue: Backend Connection Failed

**Symptoms:** "Failed to connect to backend" error

**Solutions:**
1. Verify backend process is running:
   ```powershell
   Get-Process -Name "clippy-backend" -ErrorAction SilentlyContinue
   ```
2. Manually start backend:
   ```powershell
   cd backend
   .\clippy-backend.exe
   ```
3. Check firewall settings
4. Review backend logs

### Issue: Ollama Not Found

**Symptoms:** "Cannot connect to Ollama" error

**Solutions:**
1. Install Ollama from https://ollama.ai
2. Pull a model:
   ```powershell
   ollama pull llama3.2
   ```
3. Verify Ollama service:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:11434/api/version"
   ```

### Issue: High Memory Usage

**Symptoms:** Application using > 1GB RAM

**Solutions:**
1. Clear conversation history
2. Restart application
3. Check for memory leaks in logs
4. Reduce Ollama model size (use smaller model)

### Issue: Slow Performance

**Symptoms:** UI lag, slow responses

**Solutions:**
1. Check CPU usage: `Get-Process -Name "Clippy Revival"`
2. Check disk space: `Get-PSDrive C`
3. Clear browser cache/data
4. Reduce character animation complexity

---

## Rollback Procedures

### Quick Rollback

If issues arise, rollback to previous version:

```powershell
# Stop current version
Stop-Process -Name "Clippy Revival" -Force

# Restore backup
Copy-Item -Path "C:\Backups\Clippy-Revival-Backup\*" -Destination "C:\Program Files\Clippy Revival\" -Recurse -Force

# Start previous version
Start-Process "C:\Program Files\Clippy Revival\Clippy Revival.exe"
```

### Database Rollback

If database is corrupted:

```powershell
# Stop application
Stop-Process -Name "clippy-backend" -Force

# Restore database backup
Copy-Item -Path "backend/data/conversations.db.backup" -Destination "backend/data/conversations.db"

# Restart
Start-Process "Clippy Revival.exe"
```

### Configuration Rollback

Restore default configuration:

```powershell
# Remove user settings
Remove-Item "$env:APPDATA\Clippy Revival\*" -Recurse -Force

# Application will recreate with defaults on next start
```

---

## Security Best Practices

### Production Security

1. **Never expose backend externally**
   - Backend binds to 127.0.0.1 only
   - Do not change to 0.0.0.0

2. **Keep dependencies updated**
   ```powershell
   npm audit fix
   pip-audit -r backend/requirements.txt --fix
   ```

3. **Review logs regularly**
   - Check for suspicious activity
   - Monitor failed authentication attempts

4. **Backup regularly**
   - Conversations database
   - User settings
   - Character packs

### Data Privacy

- All data stays local
- No telemetry or analytics
- Conversations stored in local SQLite database
- Character packs stored locally

---

## Support & Documentation

- **GitHub Issues:** https://github.com/cLeffNote44/clippy-revival/issues
- **Documentation:** See README.md
- **Architecture:** See ARCHITECTURE.md
- **API Docs:** http://127.0.0.1:43110/docs (when running)

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Document Version:** 2.0
**Maintained By:** Clippy Revival Team
