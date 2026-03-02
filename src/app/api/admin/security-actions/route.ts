import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { withAdminAuth } from '@/lib/admin-auth'

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { action, package: packageName } = await request.json()
    
    console.log(`🔧 Executing security action: ${action}`)
    
    switch (action) {
      case 'update-all':
        return await updateAllPackages()
      case 'update-package':
        return await updatePackage(packageName)
      case 'audit-fix':
        return await auditFix()
      case 'security-audit':
        return await securityAudit()
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error: any) {
    console.error('❌ Security action error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute security action',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function updateAllPackages() {
  try {
    console.log('🔄 Updating all packages...')
    
    // Update all packages
    const updateOutput = execSync('npm update', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000
    })
    
    // Run audit fix
    const auditOutput = execSync('npm audit fix', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000
    })
    
    // Run tests to ensure everything works
    const testOutput = execSync('npm run test:security', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000
    })
    
    return NextResponse.json({
      success: true,
      action: 'update-all',
      output: {
        update: updateOutput,
        audit: auditOutput,
        test: testOutput
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      action: 'update-all',
      error: error.message,
      output: error.stdout || error.message,
      timestamp: new Date().toISOString()
    })
  }
}

async function updatePackage(packageName: string) {
  try {
    if (!packageName) {
      throw new Error('Package name is required')
    }
    
    console.log(`🔄 Updating package: ${packageName}`)
    
    // Update specific package
    const updateOutput = execSync(`npm update ${packageName}`, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000
    })
    
    // Run tests
    const testOutput = execSync('npm run test:security', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000
    })
    
    return NextResponse.json({
      success: true,
      action: 'update-package',
      package: packageName,
      output: {
        update: updateOutput,
        test: testOutput
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      action: 'update-package',
      package: packageName,
      error: error.message,
      output: error.stdout || error.message,
      timestamp: new Date().toISOString()
    })
  }
}

async function auditFix() {
  try {
    console.log('🔧 Running npm audit fix...')
    
    const output = execSync('npm audit fix --force', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000
    })
    
    return NextResponse.json({
      success: true,
      action: 'audit-fix',
      output: output,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      action: 'audit-fix',
      error: error.message,
      output: error.stdout || error.message,
      timestamp: new Date().toISOString()
    })
  }
}

async function securityAudit() {
  try {
    console.log('🔍 Running security audit...')
    
    const output = execSync('npm audit --json', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000
    })
    
    const auditResult = JSON.parse(output)
    
    return NextResponse.json({
      success: true,
      action: 'security-audit',
      output: auditResult,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      action: 'security-audit',
      error: error.message,
      output: error.stdout || error.message,
      timestamp: new Date().toISOString()
    })
  }
}
