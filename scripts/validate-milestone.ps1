# Clippy Revival - Vertical Slice Milestone Validation Script
# This script validates that all milestone requirements are met

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Clippy Revival - Milestone Check  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$script:passCount = 0
$script:failCount = 0
$script:warnCount = 0

function Test-Requirement {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage = "OK",
        [string]$FailMessage = "FAIL"
    )
    
    Write-Host "Checking: $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✓ $SuccessMessage" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            Write-Host " ✗ $FailMessage" -ForegroundColor Red
            $script:failCount++
            return $false
        }
    } catch {
        Write-Host " ✗ Error: $_" -ForegroundColor Red
        $script:failCount++
        return $false
    }
}

function Test-Warning {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$Message
    )
    
    Write-Host "Checking: $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✓ OK" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            Write-Host " ⚠ $Message" -ForegroundColor Yellow
            $script:warnCount++
            return $false
        }
    } catch {
        Write-Host " ⚠ $Message" -ForegroundColor Yellow
        $script:warnCount++
        return $false
    }
}

Write-Host "PHASE 1: Prerequisites" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "Node.js installed" -Test {
    $version = node --version 2>$null
    return $version -match "v\d+\.\d+"
} -SuccessMessage "Node.js found: $(node --version)"

Test-Requirement -Name "npm installed" -Test {
    $version = npm --version 2>$null
    return $version -match "\d+\.\d+"
} -SuccessMessage "npm found: v$(npm --version)"

Test-Requirement -Name "Python installed" -Test {
    $version = python --version 2>$null
    return $version -match "Python \d+\.\d+"
} -SuccessMessage "Python found: $(python --version)"

Test-Warning -Name "Ollama installed" -Test {
    $version = ollama --version 2>$null
    return $version -ne $null
} -Message "Ollama not found (optional for AI features)"

Write-Host ""
Write-Host "PHASE 2: Project Structure" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "package.json exists" -Test {
    Test-Path "package.json"
}

Test-Requirement -Name "backend/app.py exists" -Test {
    Test-Path "backend/app.py"
}

Test-Requirement -Name "electron/main.js exists" -Test {
    Test-Path "electron/main.js"
}

Test-Requirement -Name "src/App.js exists" -Test {
    Test-Path "src/App.js"
}

Test-Requirement -Name "characters directory exists" -Test {
    Test-Path "characters" -PathType Container
}

Test-Requirement -Name "Character schema exists" -Test {
    Test-Path "characters/character-schema.json"
}

Write-Host ""
Write-Host "PHASE 3: Dependencies" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "node_modules exists" -Test {
    Test-Path "node_modules" -PathType Container
} -FailMessage "Run 'npm install'"

Test-Warning -Name "Python venv exists" -Test {
    Test-Path "backend/venv" -PathType Container
} -Message "Run 'python -m venv backend/venv'"

Test-Warning -Name "Python packages installed" -Test {
    $activateScript = "backend\venv\Scripts\Activate.ps1"
    if (Test-Path $activateScript) {
        & $activateScript
        $result = pip show fastapi 2>$null
        deactivate 2>$null
        return $result -ne $null
    }
    return $false
} -Message "Activate venv and run 'pip install -r backend/requirements.txt'"

Write-Host ""
Write-Host "PHASE 4: Core Components" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "CharacterAvatar component" -Test {
    Test-Path "src/components/CharacterAvatar.js"
}

Test-Requirement -Name "Characters page" -Test {
    Test-Path "src/pages/Characters.js"
}

Test-Requirement -Name "BuddyWindow page" -Test {
    Test-Path "src/pages/BuddyWindow.js"
}

Test-Requirement -Name "Dashboard page" -Test {
    Test-Path "src/pages/Dashboard.js"
}

Test-Requirement -Name "Settings page" -Test {
    Test-Path "src/pages/Settings.js"
}

Test-Requirement -Name "App store" -Test {
    Test-Path "src/store/appStore.js"
}

Write-Host ""
Write-Host "PHASE 5: Backend Services" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "Ollama service" -Test {
    Test-Path "backend/services/ollama_service.py"
}

Test-Requirement -Name "Agent service" -Test {
    Test-Path "backend/services/agent_service.py"
}

Test-Requirement -Name "Files service" -Test {
    Test-Path "backend/services/files_service.py"
}

Test-Requirement -Name "System service" -Test {
    Test-Path "backend/services/system_service.py"
}

Test-Requirement -Name "Software service" -Test {
    Test-Path "backend/services/software_service.py"
}

Test-Requirement -Name "Web service" -Test {
    Test-Path "backend/services/web_service.py"
}

Test-Requirement -Name "Character service" -Test {
    Test-Path "backend/services/character_service.py"
}

Test-Requirement -Name "WebSocket manager" -Test {
    Test-Path "backend/services/websocket_manager.py"
}

Write-Host ""
Write-Host "PHASE 6: API Routers" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "AI router" -Test {
    Test-Path "backend/api/ai_router.py"
}

Test-Requirement -Name "System router" -Test {
    Test-Path "backend/api/system_router.py"
}

Test-Requirement -Name "Files router" -Test {
    Test-Path "backend/api/files_router.py"
}

Test-Requirement -Name "Software router" -Test {
    Test-Path "backend/api/software_router.py"
}

Test-Requirement -Name "Web router" -Test {
    Test-Path "backend/api/web_router.py"
}

Test-Requirement -Name "Characters router" -Test {
    Test-Path "backend/api/characters.py"
}

Write-Host ""
Write-Host "PHASE 7: Documentation" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "README.md" -Test {
    (Test-Path "README.md") -and ((Get-Content "README.md" -Raw).Length -gt 1000)
} -SuccessMessage "Complete"

Test-Requirement -Name "ARCHITECTURE.md" -Test {
    Test-Path "ARCHITECTURE.md"
}

Test-Requirement -Name "BUILD.md" -Test {
    Test-Path "BUILD.md"
}

Test-Requirement -Name "Character pack guide" -Test {
    Test-Path "characters/README.md"
}

Write-Host ""
Write-Host "PHASE 8: Build Configuration" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Test-Requirement -Name "Webpack config" -Test {
    Test-Path "webpack.renderer.config.js"
}

Test-Requirement -Name "Build scripts directory" -Test {
    Test-Path "scripts" -PathType Container
}

Test-Warning -Name "Backend build script" -Test {
    Test-Path "scripts/build-backend.ps1"
} -Message "Create build script for PyInstaller"

Test-Warning -Name "PyInstaller spec" -Test {
    Test-Path "backend/app.spec"
} -Message "Create PyInstaller spec file"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "            TEST SUMMARY             " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Passed:  $script:passCount" -ForegroundColor Green
Write-Host "✗ Failed:  $script:failCount" -ForegroundColor Red
Write-Host "⚠ Warnings: $script:warnCount" -ForegroundColor Yellow
Write-Host ""

if ($script:failCount -eq 0) {
    Write-Host "🎉 All required checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. npm run dev       - Start development environment"
    Write-Host "  2. npm run pack      - Build production package"
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ Some checks failed. Please address the issues above." -ForegroundColor Red
    Write-Host ""
    exit 1
}
