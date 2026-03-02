import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // Check environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME ? 'SET' : 'NOT SET',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }

    // Test database connection
    let dbStatus = 'NOT TESTED'
    let dbError = null
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY
      
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Test connection with a simple query
        const { data, error } = await supabase
          .from('submissions')
          .select('count')
          .limit(1)
        
        if (error) {
          dbError = error.message
          dbStatus = 'ERROR'
        } else {
          dbStatus = 'CONNECTED'
        }
      } else {
        dbStatus = 'MISSING CREDENTIALS'
      }
    } catch (error: any) {
      dbError = error.message
      dbStatus = 'FAILED'
    }

    // Check security script status
    const securityScriptPath = path.join(process.cwd(), 'scripts', 'security-check.js')
    const scriptExists = fs.existsSync(securityScriptPath)
    
    let securityStatus = {
      scriptExists,
      secrets: { status: 'NOT TESTED', issues: 0, details: '' },
      dependencies: { status: 'NOT TESTED', issues: 0, details: '' },
      typescript: { status: 'NOT TESTED', issues: 0, details: '' },
      api: { status: 'NOT TESTED', issues: 0, details: '' },
      totalIssues: 0
    }

    if (scriptExists) {
      try {
        // Run npm audit for dependency check
        try {
          const auditResult = execSync('npm audit --audit-level=moderate --json', { 
            encoding: 'utf8', 
            stdio: 'pipe' 
          })
          const auditData = JSON.parse(auditResult)
          const vulnCount = Object.keys(auditData.vulnerabilities || {}).length
          
          securityStatus.dependencies = { 
            status: vulnCount > 0 ? 'WARN' : 'PASS', 
            issues: vulnCount,
            details: vulnCount > 0 ? `${vulnCount} vulnerabilities found` : 'No vulnerabilities'
          }
          securityStatus.totalIssues += vulnCount
        } catch (auditError) {
          // npm audit returns non-zero exit code for vulnerabilities
          try {
            const auditResult = execSync('npm audit --audit-level=moderate --json', { 
              encoding: 'utf8', 
              stdio: 'pipe' 
            })
            const auditData = JSON.parse(auditResult)
            const vulnCount = Object.keys(auditData.vulnerabilities || {}).length
            
            securityStatus.dependencies = { 
              status: vulnCount > 0 ? 'WARN' : 'PASS', 
              issues: vulnCount,
              details: vulnCount > 0 ? `${vulnCount} vulnerabilities found` : 'No vulnerabilities'
            }
            securityStatus.totalIssues += vulnCount
          } catch (parseError) {
            securityStatus.dependencies = { 
              status: 'ERROR', 
              issues: 1,
              details: 'Could not parse audit results'
            }
            securityStatus.totalIssues += 1
          }
        }

        // Check for security configuration files
        const securityFiles = [
          '.gitleaks.toml',
          '.github/workflows/security.yml',
          '.github/CODEOWNERS',
          '.husky/pre-commit',
          '.husky/pre-push'
        ]

        let missingFiles = 0
        for (const file of securityFiles) {
          if (!fs.existsSync(path.join(process.cwd(), file))) {
            missingFiles++
          }
        }

        securityStatus.secrets = { 
          status: missingFiles === 0 ? 'PASS' : 'WARN', 
          issues: missingFiles,
          details: missingFiles === 0 ? 'All security files present' : `${missingFiles} security files missing`
        }
        securityStatus.totalIssues += missingFiles

        // Check TypeScript security patterns (basic check)
        const srcFiles = ['src/app', 'src/components', 'src/lib']
        let unsafePatterns = 0
        
        for (const srcFile of srcFiles) {
          try {
            const files = fs.readdirSync(path.join(process.cwd(), srcFile), { recursive: true })
            for (const file of files) {
              if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
                try {
                  const filePath = path.join(process.cwd(), srcFile, file)
                  const content = fs.readFileSync(filePath, 'utf8')
                  
                  // Check for unsafe patterns
                  if (content.includes('any[') || content.includes('eval(') || content.includes('innerHTML')) {
                    unsafePatterns++
                  }
                } catch (readError) {
                  // Skip files that can't be read
                }
              }
            }
          } catch (dirError) {
            // Skip directories that don't exist
          }
        }

        securityStatus.typescript = { 
          status: unsafePatterns === 0 ? 'PASS' : 'WARN', 
          issues: unsafePatterns,
          details: unsafePatterns === 0 ? 'No unsafe patterns found' : `${unsafePatterns} unsafe patterns detected`
        }
        securityStatus.totalIssues += unsafePatterns

        // Check API routes for authentication
        const apiRoutesPath = path.join(process.cwd(), 'src/app/api')
        let unsecuredRoutes = 0
        
        if (fs.existsSync(apiRoutesPath)) {
          const apiRoutes = fs.readdirSync(apiRoutesPath, { recursive: true })
          for (const route of apiRoutes) {
            if (typeof route === 'string' && route.endsWith('route.ts')) {
              try {
                const routePath = path.join(apiRoutesPath, route)
                const content = fs.readFileSync(routePath, 'utf8')
                
                // Check if route has authentication
                if (!content.includes('auth') && !content.includes('token') && !content.includes('jwt') && !content.includes('verify')) {
                  // Skip if it's a public route
                  if (!content.includes('health') && !content.includes('public') && !content.includes('status')) {
                    unsecuredRoutes++
                  }
                }
              } catch (readError) {
                // Skip files that can't be read
              }
            }
          }
        }

        securityStatus.api = { 
          status: unsecuredRoutes === 0 ? 'PASS' : 'WARN', 
          issues: unsecuredRoutes,
          details: unsecuredRoutes === 0 ? 'All API routes secured' : `${unsecuredRoutes} unsecured API routes`
        }
        securityStatus.totalIssues += unsecuredRoutes

      } catch (error: any) {
        securityStatus.secrets = { status: 'ERROR', issues: 1, details: error.message }
        securityStatus.dependencies = { status: 'ERROR', issues: 1, details: error.message }
        securityStatus.typescript = { status: 'ERROR', issues: 1, details: error.message }
        securityStatus.api = { status: 'ERROR', issues: 1, details: error.message }
        securityStatus.totalIssues = 4
      }
    } else {
      securityStatus.secrets = { status: 'FAIL', issues: 1, details: 'Security script not found' }
      securityStatus.dependencies = { status: 'FAIL', issues: 1, details: 'Security script not found' }
      securityStatus.typescript = { status: 'FAIL', issues: 1, details: 'Security script not found' }
      securityStatus.api = { status: 'FAIL', issues: 1, details: 'Security script not found' }
      securityStatus.totalIssues = 4
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: env,
      database: {
        status: dbStatus,
        error: dbError
      },
      security: securityStatus,
      message: 'Debug information retrieved successfully'
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
