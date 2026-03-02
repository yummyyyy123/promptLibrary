#!/usr/bin/env node

// Environment Variable Security Checker
// Validates that all required environment variables are present and properly configured

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_KEY', 
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

const optionalEnvVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL'
];

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

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  
  if (!value) {
    if (required) {
      colorLog('red', `❌ Missing required environment variable: ${name}`);
      return false;
    } else {
      colorLog('yellow', `⚠️  Missing optional environment variable: ${name}`);
      return true; // Optional vars don't fail the check
    }
  }
  
  // Additional security checks
  if (name.includes('SECRET') || name.includes('KEY') || name.includes('PASSWORD')) {
    if (value.length < 16) {
      colorLog('red', `❌ Insecure ${name}: must be at least 16 characters`);
      return false;
    }
    if (value === 'your-secret-key-change-in-production' || value === 'change-me') {
      colorLog('red', `❌ Insecure ${name}: using default placeholder value`);
      return false;
    }
  }
  
  if (name.includes('URL')) {
    try {
      new URL(value);
      colorLog('green', `✅ Valid URL: ${name}`);
    } catch (error) {
      colorLog('red', `❌ Invalid URL format for ${name}: ${value}`);
      return false;
    }
  }
  
  colorLog('green', `✅ Environment variable set: ${name}`);
  return true;
}

function checkSecurityConfiguration() {
  colorLog('blue', '\n🔒 Checking Security Configuration...\n');
  
  let allPassed = true;
  
  // Check required environment variables
  colorLog('blue', '📋 Required Environment Variables:');
  for (const envVar of requiredEnvVars) {
    if (!checkEnvVar(envVar, true)) {
      allPassed = false;
    }
  }
  
  // Check optional environment variables
  colorLog('\n📋 Optional Environment Variables:');
  for (const envVar of optionalEnvVars) {
    checkEnvVar(envVar, false);
  }
  
  // Additional security checks
  colorLog('\n🔍 Additional Security Checks:');
  
  // Check if running in development with production secrets
  if (process.env.NODE_ENV === 'development') {
    const prodVars = ['SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
    for (const envVar of prodVars) {
      if (process.env[envVar] && process.env[envVar].includes('prod')) {
        colorLog('yellow', `⚠️  Production-like value detected in development: ${envVar}`);
      }
    }
  }
  
  // Check for common insecure patterns
  const insecurePatterns = [
    'password=123',
    'secret=secret',
    'key=key',
    'admin=admin'
  ];
  
  for (const pattern of insecurePatterns) {
    for (const [key, value] of Object.entries(process.env)) {
      if (value && value.toLowerCase().includes(pattern)) {
        colorLog('red', `❌ Insecure pattern detected in ${key}: ${pattern}`);
        allPassed = false;
      }
    }
  }
  
  // Check JWT secret strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      colorLog('yellow', '⚠️  JWT_SECRET should be at least 32 characters for better security');
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(jwtSecret)) {
      colorLog('yellow', '⚠️  JWT_SECRET contains non-alphanumeric characters, ensure proper encoding');
    }
  }
  
  return allPassed;
}

function main() {
  colorLog('blue', '🛡️  Environment Variable Security Check');
  colorLog('blue', '=====================================\n');
  
  const allPassed = checkSecurityConfiguration();
  
  colorLog('\n' + '='.repeat(40));
  if (allPassed) {
    colorLog('green', '🎉 All security checks passed!');
    colorLog('green', '✅ Environment is properly configured');
    process.exit(0);
  } else {
    colorLog('red', '🚨 Security issues detected!');
    colorLog('red', '❌ Please fix the issues above before proceeding');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvVar, checkSecurityConfiguration };
