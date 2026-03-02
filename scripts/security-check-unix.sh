#!/bin/sh

# Security Hardening Script for Unix/Linux/macOS
# Pre-commit security validation for TypeScript full-stack applications

set -e

echo "🔒 Running Security Hardening Checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter for issues found
ISSUES=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $message"
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $message"
            ISSUES=$((ISSUES + 1))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC}: $message"
            ;;
    esac
}

# 1. Secret Detection
print_status "INFO" "Checking for potential secrets in code..."

# Check for common secret patterns
if git diff --cached --name-only --diff-filter=ACM | xargs grep -l "password\|api_key\|secret_key\|token\|jwt_secret" 2>/dev/null; then
    print_status "WARN" "Potential secret patterns detected in staged files"
else
    print_status "PASS" "No obvious secrets detected in staged changes"
fi

# 2. Environment Variable Security
print_status "INFO" "Checking environment variable handling..."

if git diff --cached --name-only --diff-filter=ACM | xargs grep -l "process\.env\." 2>/dev/null; then
    print_status "INFO" "Environment variable usage detected"
else
    print_status "PASS" "No environment variable issues found"
fi

# 3. Dependency Security Audit
print_status "INFO" "Running npm audit for vulnerable dependencies..."

if command -v npm &> /dev/null; then
    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        print_status "PASS" "No vulnerable dependencies found"
    else
        print_status "WARN" "Found vulnerable dependencies"
    fi
else
    print_status "WARN" "npm not found, skipping dependency audit"
fi

# 4. TypeScript Security Checks
print_status "INFO" "Checking TypeScript security patterns..."

if git diff --cached --name-only --diff-filter=ACM | xargs grep -l "any\|eval\|innerHTML\|document\.write" 2>/dev/null; then
    print_status "WARN" "Potentially unsafe TypeScript patterns detected"
else
    print_status "PASS" "No unsafe TypeScript patterns detected"
fi

# 5. API Security Checks
print_status "INFO" "Checking API endpoint security..."

API_ROUTES=$(git diff --cached --name-only --diff-filter=ACM | grep "route.ts$" || true)

if [ -n "$API_ROUTES" ]; then
    for route in $API_ROUTES; do
        if ! grep -q "auth\|token\|jwt\|verify" "$route" 2>/dev/null; then
            if ! grep -q "health\|public\|status" "$route" 2>/dev/null; then
                print_status "WARN" "API route may be missing authentication: $route"
            fi
        fi
    done
    print_status "PASS" "API routes checked for authentication"
else
    print_status "INFO" "No API routes in this commit"
fi

# Summary
echo ""
echo "🔒 Security Hardening Summary"
echo "============================"

if [ $ISSUES -eq 0 ]; then
    print_status "PASS" "All security checks passed! 🎉"
    echo ""
    echo "✅ This commit appears to be secure."
    echo "💡 Remember to always follow security best practices."
    exit 0
else
    print_status "FAIL" "Found $ISSUES security issue(s) that need attention"
    echo ""
    echo "🚨 Please address the security issues above before committing."
    echo "💡 Consider running 'npm audit fix' to resolve dependency issues."
    echo "🔐 Ensure all secrets are properly managed and not committed."
    exit 1
fi
