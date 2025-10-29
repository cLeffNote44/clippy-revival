#!/bin/bash

###############################################################################
# Security Check Script for Clippy Revival
# Runs dependency vulnerability scans and security checks
###############################################################################

set -e

echo "=================================="
echo "Clippy Revival Security Check"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ISSUES_FOUND=0

###############################################################################
# 1. NPM Audit (Frontend Dependencies)
###############################################################################
echo "1. Running npm audit (Frontend)..."
echo "-----------------------------------"

if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✓ No vulnerabilities found in npm packages${NC}"
else
    echo -e "${RED}✗ Vulnerabilities found in npm packages${NC}"
    echo "Run 'npm audit fix' to attempt automatic fixes"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

###############################################################################
# 2. Check for outdated packages
###############################################################################
echo "2. Checking for outdated packages..."
echo "-----------------------------------"

OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")

if [ "$OUTDATED" = "{}" ]; then
    echo -e "${GREEN}✓ All packages are up to date${NC}"
else
    echo -e "${YELLOW}⚠ Some packages have updates available${NC}"
    npm outdated || true
    echo "Run 'npm update' to update to compatible versions"
fi

echo ""

###############################################################################
# 3. Check Python dependencies (if backend exists)
###############################################################################
if [ -d "backend" ]; then
    echo "3. Checking Python dependencies..."
    echo "-----------------------------------"

    if [ -f "backend/requirements.txt" ]; then
        cd backend

        # Check if pip-audit is available
        if command -v pip-audit &> /dev/null; then
            echo "Running pip-audit..."
            if pip-audit; then
                echo -e "${GREEN}✓ No vulnerabilities found in Python packages${NC}"
            else
                echo -e "${RED}✗ Vulnerabilities found in Python packages${NC}"
                ISSUES_FOUND=$((ISSUES_FOUND + 1))
            fi
        else
            echo -e "${YELLOW}⚠ pip-audit not installed${NC}"
            echo "Install with: pip install pip-audit"
        fi

        cd ..
    else
        echo "No requirements.txt found"
    fi

    echo ""
fi

###############################################################################
# 4. Check for sensitive files
###############################################################################
echo "4. Checking for sensitive files..."
echo "-----------------------------------"

SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "credentials.json"
    "secrets.json"
    "*.pem"
    "*.key"
    "id_rsa"
    "id_dsa"
)

FOUND_SENSITIVE=0

for pattern in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$pattern" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | grep -q .; then
        echo -e "${YELLOW}⚠ Found potentially sensitive file: $pattern${NC}"
        FOUND_SENSITIVE=1
    fi
done

if [ $FOUND_SENSITIVE -eq 0 ]; then
    echo -e "${GREEN}✓ No sensitive files found in repository${NC}"
else
    echo -e "${YELLOW}⚠ Sensitive files found - ensure they are in .gitignore${NC}"
fi

echo ""

###############################################################################
# 5. Check .gitignore
###############################################################################
echo "5. Checking .gitignore configuration..."
echo "-----------------------------------"

REQUIRED_ENTRIES=(
    ".env"
    "node_modules"
    "*.log"
    "*.pem"
    "*.key"
)

MISSING_ENTRIES=()

if [ -f ".gitignore" ]; then
    for entry in "${REQUIRED_ENTRIES[@]}"; do
        if ! grep -q "$entry" .gitignore; then
            MISSING_ENTRIES+=("$entry")
        fi
    done

    if [ ${#MISSING_ENTRIES[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ .gitignore properly configured${NC}"
    else
        echo -e "${YELLOW}⚠ .gitignore missing entries:${NC}"
        for entry in "${MISSING_ENTRIES[@]}"; do
            echo "  - $entry"
        done
    fi
else
    echo -e "${RED}✗ .gitignore file not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

###############################################################################
# 6. Check for hardcoded secrets
###############################################################################
echo "6. Checking for hardcoded secrets..."
echo "-----------------------------------"

# Simple pattern matching for common secret formats
SECRET_PATTERNS=(
    "password\s*=\s*['\"]"
    "api_key\s*=\s*['\"]"
    "secret\s*=\s*['\"]"
    "token\s*=\s*['\"]"
    "bearer\s+[A-Za-z0-9_-]{20,}"
)

FOUND_SECRETS=0

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -rI -E "$pattern" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.py" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 2>/dev/null | grep -v "example" | grep -v "TODO" | grep -v "FIXME" | head -n 1 | grep -q .; then
        echo -e "${YELLOW}⚠ Possible hardcoded secret found (pattern: $pattern)${NC}"
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✓ No obvious hardcoded secrets found${NC}"
else
    echo -e "${YELLOW}⚠ Review findings above - may be false positives${NC}"
fi

echo ""

###############################################################################
# 7. Security Headers Check (if server is running)
###############################################################################
echo "7. Checking security headers..."
echo "-----------------------------------"

if command -v curl &> /dev/null; then
    if curl -s -I http://localhost:43110/health > /dev/null 2>&1; then
        HEADERS=$(curl -s -I http://localhost:43110/health)

        REQUIRED_HEADERS=(
            "X-Content-Type-Options"
            "X-Frame-Options"
            "X-XSS-Protection"
        )

        MISSING_HEADERS=()

        for header in "${REQUIRED_HEADERS[@]}"; do
            if ! echo "$HEADERS" | grep -qi "$header"; then
                MISSING_HEADERS+=("$header")
            fi
        done

        if [ ${#MISSING_HEADERS[@]} -eq 0 ]; then
            echo -e "${GREEN}✓ All security headers present${NC}"
        else
            echo -e "${YELLOW}⚠ Missing security headers:${NC}"
            for header in "${MISSING_HEADERS[@]}"; do
                echo "  - $header"
            done
        fi
    else
        echo -e "${YELLOW}⚠ Backend server not running - skipping header check${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl not available - skipping header check${NC}"
fi

echo ""

###############################################################################
# Summary
###############################################################################
echo "=================================="
echo "Security Check Summary"
echo "=================================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No critical security issues found${NC}"
    echo ""
    echo "Recommendations:"
    echo "- Keep dependencies updated regularly"
    echo "- Review outdated packages"
    echo "- Monitor security advisories"
    exit 0
else
    echo -e "${RED}✗ $ISSUES_FOUND critical issue(s) found${NC}"
    echo ""
    echo "Please address the issues above before deploying."
    exit 1
fi
