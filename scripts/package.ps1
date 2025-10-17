# Complete Build and Package Script for Clippy Revival
param(
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Clippy Revival - Build & Package  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build Frontend
if (-not $SkipFrontend) {
    Write-Host "Building frontend..." -ForegroundColor Green
    Write-Host "Running webpack production build..." -ForegroundColor Yellow
    
    npm run build:renderer
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Frontend built successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Skipping frontend build" -ForegroundColor Yellow
    Write-Host ""
}

# Build Backend
if (-not $SkipBackend) {
    Write-Host "Building backend..." -ForegroundColor Green
    
    Set-Location backend
    
    # Check for venv
    if (-not (Test-Path "venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
        & .\venv\Scripts\Activate.ps1
        pip install -r requirements.txt
    } else {
        & .\venv\Scripts\Activate.ps1
    }
    
    # Clean previous build
    if (Test-Path "dist") {
        Write-Host "Cleaning previous backend build..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force dist
    }
    if (Test-Path "build") {
        Remove-Item -Recurse -Force build
    }
    
    # Build with PyInstaller
    Write-Host "Running PyInstaller..." -ForegroundColor Yellow
    pyinstaller app.spec --clean --noconfirm
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend build failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    # Verify backend was built
    if (-not (Test-Path "dist\clippy-backend\clippy-backend.exe")) {
        Write-Host "Backend executable not found!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Write-Host "✓ Backend built successfully" -ForegroundColor Green
    Set-Location ..
    Write-Host ""
} else {
    Write-Host "Skipping backend build" -ForegroundColor Yellow
    Write-Host ""
}

# Package with electron-builder
Write-Host "Packaging application..." -ForegroundColor Green
Write-Host "Running electron-builder..." -ForegroundColor Yellow

npx electron-builder --win zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "Packaging failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "       Build Complete! 🎉           " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Show build artifacts
if (Test-Path "build") {
    Write-Host "Build artifacts:" -ForegroundColor Green
    Get-ChildItem -Path "build" -Filter "*.zip" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  • $($_.Name) ($size MB)" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "Output directory: $(Get-Location)\build" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "You can now distribute the zip file!" -ForegroundColor Green