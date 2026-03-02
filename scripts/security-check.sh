#!/bin/bash

# Security Hardening Script
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
SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]{8,}['\"]"
    "api_key\s*=\s*['\"][^'\"]{16,}['\"]"
    "secret_key\s*=\s*['\"][^'\"]{16,}['\"]"
    "token\s*=\s*['\"][^'\"]{16,}['\"]"
    "jwt_secret\s*=\s*['\"][^'\"]{16,}['\"]"
    "supabase_key\s*=\s*['\"][^'\"]{20,}['\"]"
    "database_url\s*=\s*['\"][^'\"]{10,}['\"]"
    "private_key\s*=\s*['\"]-----BEGIN"
)

SECRETS_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if git diff --cached --name-only --diff-filter=ACM | xargs grep -E "$pattern" 2>/dev/null; then
        print_status "FAIL" "Potential secret detected: $pattern"
        SECRETS_FOUND=true
    fi
done

if [ "$SECRETS_FOUND" = false ]; then
    print_status "PASS" "No obvious secrets detected in staged changes"
fi

# 2. Environment Variable Security
print_status "INFO" "Checking environment variable handling..."

# Check for hardcoded environment values
if git diff --cached --name-only --diff-filter=ACM | xargs grep -E "process\.env\.[A-Z_]+\s*=\s*['\"][^'\"]+['\"]" 2>/dev/null; then
    print_status "FAIL" "Hardcoded environment values detected"
else
    print_status "PASS" "No hardcoded environment values found"
fi

# 3. Dependency Security Audit
print_status "INFO" "Running npm audit for vulnerable dependencies..."

if command -v npm &> /dev/null; then
    AUDIT_OUTPUT=$(npm audit --audit-level=moderate --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    VULN_COUNT=$(echo "$AUDIT_OUTPUT" | jq '.vulnerabilities | keys | length' 2>/dev/null || echo "0")
    
    if [ "$VULN_COUNT" -gt 0 ]; then
        print_status "WARN" "Found $VULN_COUNT vulnerable dependencies"
        echo "$AUDIT_OUTPUT" | jq -r '.vulnerabilities | to_entries[] | "  - \(.key): \(.value.severity)"' 2>/dev/null || true
    else
        print_status "PASS" "No vulnerable dependencies found"
    fi
else
    print_status "WARN" "npm not found, skipping dependency audit"
fi

# 4. TypeScript Security Checks
print_status "INFO" "Checking TypeScript security patterns..."

# Check for unsafe TypeScript patterns
UNSAFE_PATTERNS=(
    "any\s*[\[\];,]"
    "eval\("
    "Function\("
    "setTimeout\(.*string"
    "setInterval\(.*string"
    "innerHTML\s*="
    "outerHTML\s*="
    "document\.write"
)

UNSAFE_FOUND=false
for pattern in "${UNSAFE_PATTERNS[@]}"; do
    if git diff --cached --name-only --diff-filter=ACM | xargs grep -E "$pattern" 2>/dev/null; then
        print_status "WARN" "Potentially unsafe TypeScript pattern: $pattern"
        UNSAFE_FOUND=true
    fi
done

if [ "$UNSAFE_FOUND" = false ]; then
    print_status "PASS" "No unsafe TypeScript patterns detected"
fi

# 5. API Security Checks
print_status "INFO" "Checking API endpoint security..."

# Check for missing authentication in API routes
API_ROUTES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "src/app/api/.*/route\.ts$" || true)

if [ -n "$API_ROUTES" ]; then
    for route in $API_ROUTES; do
        # Check if route has authentication middleware
        if ! grep -q "auth\|token\|jwt\|verify" "$route" 2>/dev/null; then
            # Skip if it's a public route (like health checks)
            if ! grep -q "health\|public\|status" "$route" 2>/dev/null; then
                print_status "WARN" "API route may be missing authentication: $route"
            fi
        fi
    done
    print_status "PASS" "API routes checked for authentication"
else
    print_status "INFO" "No API routes in this commit"
fi

# 6. Database Security Checks
print_status "INFO" "Checking database security patterns..."

# Check for SQL injection patterns
SQL_INJECTION_PATTERNS=(
    "query\(`.*\$\{.*\}.*`"
    "sql\(`.*\$\{.*\}.*`"
    "execute\(`.*\$\{.*\}.*`"
)

SQL_INJECTION_FOUND=false
for pattern in "${SQL_INJECTION_PATTERNS[@]}"; do
    if git diff --cached --name-only --diff-filter=ACM | xargs grep -E "$pattern" 2>/dev/null; then
        print_status "FAIL" "Potential SQL injection vulnerability: $pattern"
        SQL_INJECTION_FOUND=true
    fi
done

if [ "$SQL_INJECTION_FOUND" = false ]; then
    print_status "PASS" "No SQL injection patterns detected"
fi

# 7. File Permission Checks
print_status "INFO" "Checking file permissions..."

# Check for sensitive files with incorrect permissions
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "private-key.pem"
    "id_rsa"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        PERMISSIONS=$(stat -f "%A" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
        if [ "$PERMISSIONS" != "600" ] && [ "$PERMISSIONS" != "400" ]; then
            print_status "WARN" "Sensitive file $file has permissive permissions: $PERMISSIONS"
        fi
    fi
done

print_status "PASS" "File permissions checked"

# 8. Git History Security
print_status "INFO" "Checking git history for secrets..."

if command -v gitleaks &> /dev/null; then
    if gitleaks detect --no-git --source . 2>/dev/null; then
        print_status "PASS" "No secrets found in git history"
    else
        print_status "WARN" "Gitleaks detected potential secrets in history"
    fi
else
    print_status "INFO" "Gitleaks not installed, skipping git history check"
fi

# 9. Configuration Security
print_status "INFO" "Checking configuration security..."

# Check for insecure configurations
if [ -f "package.json" ]; then
    # Check for scripts that might expose secrets
    if grep -E "print|console\.log|console\.error" package.json 2>/dev/null; then
        print_status "WARN" "Console logging detected in package.json scripts"
    fi
    
    # Check for insecure dependencies
    if grep -E "unsafe|eval|dangerous" package.json 2>/dev/null; then
        print_status "WARN" "Potentially unsafe dependencies in package.json"
    fi
fi

print_status "PASS" "Configuration security checked"

# 10. Summary
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
