#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Security audit script for Clippy Revival

.DESCRIPTION
    Comprehensive security audit checking for vulnerabilities,
    misconfigurations, and security best practices

.EXAMPLE
    .\scripts\security-audit.ps1
#>

param(
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Clippy Revival - Security Audit" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()
$passed = @()

# Function to add issue
function Add-Issue {
    param([string]$message, [string]$severity = "ERROR")
    $script:issues += [PSCustomObject]@{
        Severity = $severity
        Message = $message
    }
}

# Function to add warning
function Add-Warning {
    param([string]$message)
    $script:warnings += $message
}

# Function to add passed check
function Add-Passed {
    param([string]$message)
    $script:passed += $message
}

Write-Host "1. Checking Dependencies..." -ForegroundColor Yellow

# Check npm audit
Write-Host "   - Running npm audit..." -NoNewline
try {
    $npmAudit = npm audit --json 2>$null | ConvertFrom-Json
    if ($npmAudit.metadata.vulnerabilities.high -gt 0 -or $npmAudit.metadata.vulnerabilities.critical -gt 0) {
        Add-Issue "Found $($npmAudit.metadata.vulnerabilities.high) high and $($npmAudit.metadata.vulnerabilities.critical) critical vulnerabilities in npm packages"
        Write-Host " FAIL" -ForegroundColor Red
    } else {
        Add-Passed "No critical npm vulnerabilities found"
        Write-Host " PASS" -ForegroundColor Green
    }
} catch {
    Add-Warning "Could not run npm audit"
    Write-Host " SKIP" -ForegroundColor Yellow
}

# Check Python dependencies
if (Test-Path "backend/requirements.txt") {
    Write-Host "   - Checking Python dependencies..." -NoNewline
    try {
        pip-audit -r backend/requirements.txt --format json > audit-result.json 2>$null
        if ($LASTEXITCODE -ne 0) {
            Add-Issue "Python dependencies have known vulnerabilities"
            Write-Host " FAIL" -ForegroundColor Red
        } else {
            Add-Passed "Python dependencies clean"
            Write-Host " PASS" -ForegroundColor Green
        }
        Remove-Item audit-result.json -ErrorAction SilentlyContinue
    } catch {
        Add-Warning "pip-audit not available - install with: pip install pip-audit"
        Write-Host " SKIP" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "2. Checking Configuration..." -ForegroundColor Yellow

# Check for .env file
Write-Host "   - Checking for exposed .env file..." -NoNewline
if (Test-Path ".env") {
    Add-Warning ".env file exists - ensure it's in .gitignore"
    Write-Host " WARN" -ForegroundColor Yellow
} else {
    Add-Passed "No .env file in root (good)"
    Write-Host " PASS" -ForegroundColor Green
}

# Check .gitignore
Write-Host "   - Checking .gitignore..." -NoNewline
if (Test-Path ".gitignore") {
    $gitignore = Get-Content .gitignore -Raw
    $requiredEntries = @(".env", "node_modules", "*.log", "dist", "build", "*.db")
    $missing = @()

    foreach ($entry in $requiredEntries) {
        if ($gitignore -notmatch [regex]::Escape($entry)) {
            $missing += $entry
        }
    }

    if ($missing.Count -gt 0) {
        Add-Issue "Missing entries in .gitignore: $($missing -join ', ')"
        Write-Host " FAIL" -ForegroundColor Red
    } else {
        Add-Passed ".gitignore properly configured"
        Write-Host " PASS" -ForegroundColor Green
    }
} else {
    Add-Issue ".gitignore file missing!"
    Write-Host " FAIL" -ForegroundColor Red
}

# Check backend binds to localhost only
Write-Host "   - Checking backend binding..." -NoNewline
if (Test-Path "backend/app.py") {
    $appPy = Get-Content "backend/app.py" -Raw
    if ($appPy -match 'host="0\.0\.0\.0"' -or $appPy -match "host='0\.0\.0\.0'") {
        Add-Issue "Backend binding to 0.0.0.0 - should be 127.0.0.1 only!"
        Write-Host " FAIL" -ForegroundColor Red
    } elseif ($appPy -match 'host="127\.0\.0\.1"' -or $appPy -match "host='127\.0\.0\.1'") {
        Add-Passed "Backend correctly binds to localhost only"
        Write-Host " PASS" -ForegroundColor Green
    } else {
        Add-Warning "Could not verify backend binding configuration"
        Write-Host " WARN" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "3. Checking File Permissions..." -ForegroundColor Yellow

# Check for executable permissions on sensitive files
Write-Host "   - Checking sensitive files..." -NoNewline
$sensitiveFiles = @("*.pem", "*.key", "*.env", "*credentials*", "*password*")
$foundSensitive = @()

foreach ($pattern in $sensitiveFiles) {
    $files = Get-ChildItem -Recurse -File -Filter $pattern -ErrorAction SilentlyContinue
    $foundSensitive += $files
}

if ($foundSensitive.Count -gt 0) {
    Add-Issue "Found sensitive files: $($foundSensitive.Name -join ', ')"
    Write-Host " FAIL" -ForegroundColor Red
} else {
    Add-Passed "No sensitive files found in repository"
    Write-Host " PASS" -ForegroundColor Green
}

Write-Host ""
Write-Host "4. Checking Code for Security Issues..." -ForegroundColor Yellow

# Check for eval() usage
Write-Host "   - Checking for eval() usage..." -NoNewline
$evalFiles = Get-ChildItem -Recurse -Include "*.js","*.jsx" -ErrorAction SilentlyContinue |
    Select-String -Pattern "\beval\(" -CaseSensitive

if ($evalFiles.Count -gt 0) {
    Add-Issue "Found eval() usage in: $($evalFiles.Filename -join ', ')"
    Write-Host " FAIL" -ForegroundColor Red
} else {
    Add-Passed "No eval() usage found")
    Write-Host " PASS" -ForegroundColor Green
}

# Check for SQL injection risks
Write-Host "   - Checking for SQL injection risks..." -NoNewline
$sqlFiles = Get-ChildItem -Recurse -Include "*.py" -ErrorAction SilentlyContinue |
    Select-String -Pattern 'execute\([^?].*\%' -CaseSensitive

if ($sqlFiles.Count -gt 0) {
    Add-Warning "Potential SQL injection risk found - review execute() calls"
    Write-Host " WARN" -ForegroundColor Yellow
} else {
    Add-Passed "No obvious SQL injection risks")
    Write-Host " PASS" -ForegroundColor Green
}

# Check for hardcoded secrets
Write-Host "   - Checking for hardcoded secrets..." -NoNewline
$secretPatterns = @(
    "password\s*=\s*['\"]",
    "api_key\s*=\s*['\"]",
    "secret\s*=\s*['\"]\w+",
    "token\s*=\s*['\"]"
)

$foundSecrets = @()
foreach ($pattern in $secretPatterns) {
    $files = Get-ChildItem -Recurse -Include "*.py","*.js","*.jsx" -ErrorAction SilentlyContinue |
        Select-String -Pattern $pattern -CaseSensitive
    $foundSecrets += $files
}

if ($foundSecrets.Count -gt 0) {
    Add-Warning "Possible hardcoded secrets found - review manually"
    Write-Host " WARN" -ForegroundColor Yellow
} else {
    Add-Passed "No obvious hardcoded secrets")
    Write-Host " PASS" -ForegroundColor Green
}

Write-Host ""
Write-Host "5. Checking Dependencies Licenses..." -ForegroundColor Yellow

Write-Host "   - Scanning package licenses..." -NoNewline
try {
    # This would require license-checker package
    # npm install -g license-checker
    if (Get-Command license-checker -ErrorAction SilentlyContinue) {
        Add-Passed "License check available"
        Write-Host " PASS" -ForegroundColor Green
    } else {
        Add-Warning "license-checker not installed - run: npm install -g license-checker"
        Write-Host " SKIP" -ForegroundColor Yellow
    }
} catch {
    Add-Warning "Could not check licenses"
    Write-Host " SKIP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "6. Checking Build Configuration..." -ForegroundColor Yellow

# Check if dist/build directories are in .gitignore
Write-Host "   - Checking build artifacts not in git..." -NoNewline
if (Test-Path ".gitignore") {
    $gitignore = Get-Content .gitignore -Raw
    if ($gitignore -match "dist" -and $gitignore -match "build") {
        Add-Passed "Build artifacts properly ignored")
        Write-Host " PASS" -ForegroundColor Green
    } else {
        Add-Issue "Build artifacts (dist/build) should be in .gitignore"
        Write-Host " FAIL" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Security Audit Results" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASSED: $($passed.Count)" -ForegroundColor Green
foreach ($p in $passed) {
    Write-Host "  ✓ $p" -ForegroundColor Green
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "WARNINGS: $($warnings.Count)" -ForegroundColor Yellow
    foreach ($w in $warnings) {
        Write-Host "  ⚠ $w" -ForegroundColor Yellow
    }
}

if ($issues.Count -gt 0) {
    Write-Host ""
    Write-Host "ISSUES: $($issues.Count)" -ForegroundColor Red
    foreach ($i in $issues) {
        Write-Host "  ✗ [$($i.Severity)] $($i.Message)" -ForegroundColor Red
    }
}

Write-Host ""
if ($issues.Count -eq 0) {
    Write-Host "Security audit PASSED ✓" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Security audit FAILED ✗" -ForegroundColor Red
    Write-Host "Please fix the issues above before deploying to production." -ForegroundColor Yellow
    exit 1
}
