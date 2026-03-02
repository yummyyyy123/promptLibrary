@echo off
REM Security Hardening Script for Windows
REM Pre-commit security validation for TypeScript full-stack applications

setlocal enabledelayedexpansion

echo 🔒 Running Security Hardening Checks...

REM Counter for issues found
set ISSUES=0

REM Function to check for secrets
echo.
echo ℹ️  INFO: Checking for potential secrets in code...

REM Check for common secret patterns in staged files
for /f "delims=" %%f in ('git diff --cached --name-only --diff-filter=ACM') do (
    findstr /C:"password" "%%f" >nul 2>&1 && (
        echo ❌ FAIL: Potential secret detected in %%f
        set /a ISSUES+=1
    )
    findstr /C:"api_key" "%%f" >nul 2>&1 && (
        echo ❌ FAIL: Potential API key detected in %%f
        set /a ISSUES+=1
    )
    findstr /C:"secret_key" "%%f" >nul 2>&1 && (
        echo ❌ FAIL: Potential secret key detected in %%f
        set /a ISSUES+=1
    )
)

if %ISSUES%==0 (
    echo ✅ PASS: No obvious secrets detected in staged changes
)

REM Check environment variables
echo.
echo ℹ️  INFO: Checking environment variable handling...

for /f "delims=" %%f in ('git diff --cached --name-only --diff-filter=ACM') do (
    findstr /C:"process.env." "%%f" | findstr /C:"=" >nul 2>&1 && (
        echo ⚠️  WARN: Environment variable usage detected in %%f
    )
)

REM Run npm audit
echo.
echo ℹ️  INFO: Running npm audit for vulnerable dependencies...

npm audit --audit-level=moderate >nul 2>&1
if %errorlevel% gtr 0 (
    echo ⚠️  WARN: Found vulnerable dependencies
    npm audit --audit-level=moderate
) else (
    echo ✅ PASS: No vulnerable dependencies found
)

REM Check TypeScript security patterns
echo.
echo ℹ️  INFO: Checking TypeScript security patterns...

for /f "delims=" %%f in ('git diff --cached --name-only --diff-filter=ACM') do (
    findstr /C:"any[" "%%f" >nul 2>&1 && (
        echo ⚠️  WARN: Potentially unsafe TypeScript pattern in %%f
    )
    findstr /C:"eval(" "%%f" >nul 2>&1 && (
        echo ⚠️  WARN: Potentially unsafe eval usage in %%f
    )
    findstr /C:"innerHTML" "%%f" >nul 2>&1 && (
        echo ⚠️  WARN: Potentially unsafe innerHTML usage in %%f
    )
)

REM Check API routes
echo.
echo ℹ️  INFO: Checking API endpoint security...

for /f "delims=" %%f in ('git diff --cached --name-only --diff-filter=ACM ^| findstr /C:"route.ts$"') do (
    findstr /C:"auth\|token\|jwt\|verify" "%%f" >nul 2>&1 || (
        findstr /C:"health\|public\|status" "%%f" >nul 2>&1 || (
            echo ⚠️  WARN: API route may be missing authentication: %%f
        )
    )
)

REM Summary
echo.
echo 🔒 Security Hardening Summary
echo ============================
if %ISSUES%==0 (
    echo ✅ PASS: All security checks passed! 🎉
    echo.
    echo ✅ This commit appears to be secure.
    echo 💡 Remember to always follow security best practices.
    exit /b 0
) else (
    echo ❌ FAIL: Found %ISSUES% security issue^(s^) that need attention
    echo.
    echo 🚨 Please address the security issues above before committing.
    echo 💡 Consider running 'npm audit fix' to resolve dependency issues.
    echo 🔐 Ensure all secrets are properly managed and not committed.
    exit /b 1
)
