# Build Backend with PyInstaller
Write-Host "Building backend executable..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
}

# Clean previous build
Write-Host "Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force build
}

# Build with PyInstaller
Write-Host "Running PyInstaller..." -ForegroundColor Yellow
pyinstaller app.spec --clean

# Check if build was successful
if (Test-Path "dist\clippy-backend\clippy-backend.exe") {
    Write-Host "Backend build successful!" -ForegroundColor Green
    Write-Host "Executable location: backend\dist\clippy-backend\" -ForegroundColor Cyan
} else {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ..

Write-Host "Done!" -ForegroundColor Green