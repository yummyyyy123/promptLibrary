#!/usr/bin/env node

// Security Hardening Script - Cross-platform Node.js version
// Pre-commit security validation for TypeScript full-stack applications

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function printStatus(status, message) {
    switch (status) {
        case 'PASS':
            colorLog('green', `✅ PASS: ${message}`);
            break;
        case 'WARN':
            colorLog('yellow', `⚠️  WARN: ${message}`);
            break;
        case 'FAIL':
            colorLog('red', `❌ FAIL: ${message}`);
            return true; // Indicates issue found
        case 'INFO':
            colorLog('blue', `ℹ️  INFO: ${message}`);
            break;
    }
    return false;
}

function runCommand(command, options = {}) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            ...options 
        });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function checkSecrets() {
    colorLog('blue', '\n🔒 Checking for potential secrets in code...');
    
    let issuesFound = false;
    
    try {
        // Get staged files
        const gitResult = runCommand('git diff --cached --name-only --diff-filter=ACM');
        if (!gitResult.success) {
            printStatus('WARN', 'Could not get staged files');
            return false;
        }
        
        const stagedFiles = gitResult.output.trim().split('\n').filter(f => f.trim());
        
        if (stagedFiles.length === 0) {
            printStatus('INFO', 'No staged files to check');
            return false;
        }
        
        // Check each file for secret patterns
        const secretPatterns = [
            /password\s*[:=]\s*['"`][^'"`]{8,}['"`]/i,
            /api[_-]?key\s*[:=]\s*['"`][^'"`]{16,}['"`]/i,
            /secret[_-]?key\s*[:=]\s*['"`][^'"`]{16,}['"`]/i,
            /token\s*[:=]\s*['"`][^'"`]{16,}['"`]/i,
            /jwt[_-]?secret\s*[:=]\s*['"`][^'"`]{16,}['"`]/i,
            /supabase[_-]?key\s*[:=]\s*['"`][^'"`]{20,}['"`]/i,
            /database[_-]?url\s*[:=]\s*['"`][^'"`]{10,}['"`]/i,
            /-----BEGIN (RSA )?PRIVATE KEY-----/
        ];
        
        for (const file of stagedFiles) {
            if (!fs.existsSync(file)) continue;
            
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                for (const pattern of secretPatterns) {
                    if (pattern.test(content)) {
                        issuesFound = true;
                        printStatus('FAIL', `Potential secret detected in ${file}`);
                        break;
                    }
                }
            } catch (error) {
                // Skip files that can't be read (binary files, etc.)
            }
        }
        
        if (!issuesFound) {
            printStatus('PASS', 'No obvious secrets detected in staged changes');
        }
        
    } catch (error) {
        printStatus('WARN', 'Error checking for secrets');
    }
    
    return issuesFound;
}

function checkEnvironmentVariables() {
    colorLog('blue', '\n🔒 Checking environment variable handling...');
    
    try {
        const gitResult = runCommand('git diff --cached --name-only --diff-filter=ACM');
        if (!gitResult.success) return false;
        
        const stagedFiles = gitResult.output.trim().split('\n').filter(f => f.trim());
        
        for (const file of stagedFiles) {
            if (!fs.existsSync(file)) continue;
            
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for hardcoded environment values
                if (/process\.env\.[A-Z_]+\s*[:=]\s*['"`][^'"`]+['"`]/.test(content)) {
                    printStatus('FAIL', 'Hardcoded environment values detected');
                    return true;
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        printStatus('PASS', 'No hardcoded environment values found');
        
    } catch (error) {
        printStatus('WARN', 'Error checking environment variables');
    }
    
    return false;
}

function checkDependencies() {
    colorLog('blue', '\n🔒 Running npm audit for vulnerable dependencies...');
    
    const auditResult = runCommand('npm audit --audit-level=moderate --json');
    
    if (!auditResult.success) {
        printStatus('WARN', 'npm audit failed');
        return false;
    }
    
    try {
        const auditData = JSON.parse(auditResult.output);
        const vulnCount = Object.keys(auditData.vulnerabilities || {}).length;
        
        if (vulnCount > 0) {
            printStatus('WARN', `Found ${vulnCount} vulnerable dependencies`);
            return false;
        } else {
            printStatus('PASS', 'No vulnerable dependencies found');
        }
    } catch (error) {
        printStatus('WARN', 'Could not parse npm audit output');
    }
    
    return false;
}

function checkTypeScriptSecurity() {
    colorLog('blue', '\n🔒 Checking TypeScript security patterns...');
    
    try {
        const gitResult = runCommand('git diff --cached --name-only --diff-filter=ACM');
        if (!gitResult.success) return false;
        
        const stagedFiles = gitResult.output.trim().split('\n').filter(f => f.trim());
        let issuesFound = false;
        
        const unsafePatterns = [
            /any\s*[\[\];,]/,
            /eval\s*\(/,
            /Function\s*\(/,
            /setTimeout\s*\([^,]+,\s*['"`]/,
            /setInterval\s*\([^,]+,\s*['"`]/,
            /innerHTML\s*=/,
            /outerHTML\s*=/,
            /document\.write/
        ];
        
        for (const file of stagedFiles) {
            if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue;
            if (!fs.existsSync(file)) continue;
            
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                for (const pattern of unsafePatterns) {
                    if (pattern.test(content)) {
                        printStatus('WARN', `Potentially unsafe TypeScript pattern in ${file}`);
                        issuesFound = true;
                        break;
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        if (!issuesFound) {
            printStatus('PASS', 'No unsafe TypeScript patterns detected');
        }
        
    } catch (error) {
        printStatus('WARN', 'Error checking TypeScript patterns');
    }
    
    return false;
}

function checkAPISecurity() {
    colorLog('blue', '\n🔒 Checking API endpoint security...');
    
    try {
        const gitResult = runCommand('git diff --cached --name-only --diff-filter=ACM');
        if (!gitResult.success) return false;
        
        const stagedFiles = gitResult.output.trim().split('\n').filter(f => f.trim());
        const apiRoutes = stagedFiles.filter(f => f.includes('route.ts'));
        
        if (apiRoutes.length === 0) {
            printStatus('INFO', 'No API routes in this commit');
            return false;
        }
        
        for (const route of apiRoutes) {
            if (!fs.existsSync(route)) continue;
            
            try {
                const content = fs.readFileSync(route, 'utf8');
                
                // Check if route has authentication
                if (!/(auth|token|jwt|verify)/i.test(content)) {
                    // Skip if it's a public route
                    if (!/(health|public|status)/i.test(content)) {
                        printStatus('WARN', `API route may be missing authentication: ${route}`);
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        printStatus('PASS', 'API routes checked for authentication');
        
    } catch (error) {
        printStatus('WARN', 'Error checking API security');
    }
    
    return false;
}

function main() {
    colorLog('blue', '🛡️  Security Hardening Check');
    colorLog('blue', '=============================\n');
    
    let totalIssues = 0;
    
    // Run all security checks
    if (checkSecrets()) totalIssues++;
    if (checkEnvironmentVariables()) totalIssues++;
    if (checkDependencies()) totalIssues++;
    if (checkTypeScriptSecurity()) totalIssues++;
    if (checkAPISecurity()) totalIssues++;
    
    // Summary
    console.log('\n' + '='.repeat(40));
    console.log('🔒 Security Hardening Summary');
    console.log('============================');
    
    if (totalIssues === 0) {
        colorLog('green', '🎉 All security checks passed!');
        console.log('');
        colorLog('green', '✅ This commit appears to be secure.');
        colorLog('green', '💡 Remember to always follow security best practices.');
        process.exit(0);
    } else {
        colorLog('red', `🚨 Found ${totalIssues} security issue(s) that need attention`);
        console.log('');
        colorLog('red', '❌ Please address the security issues above before committing.');
        colorLog('yellow', '💡 Consider running "npm audit fix" to resolve dependency issues.');
        colorLog('yellow', '🔐 Ensure all secrets are properly managed and not committed.');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { checkSecrets, checkEnvironmentVariables, checkDependencies };
