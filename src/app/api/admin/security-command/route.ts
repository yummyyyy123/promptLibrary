import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { withAdminAuth } from '@/lib/admin-auth'

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    let npmCommand = ''
    let commandName = ''

    switch (command) {
      case 'check':
        npmCommand = 'npm run security:check'
        commandName = 'Security Check'
        break
      case 'audit':
        npmCommand = 'npm run security:audit'
        commandName = 'Dependency Audit'
        break
      case 'secrets':
        npmCommand = 'npm run security:secrets'
        commandName = 'Secret Detection'
        break
      case 'full':
        npmCommand = 'npm run security:full'
        commandName = 'Full Security Suite'
        break
      case 'quick':
        npmCommand = 'npm run security:check'
        commandName = 'Quick Security Check'
        break
      case 'env':
        npmCommand = 'npm run env:check'
        commandName = 'Environment Check'
        break
      case 'test':
        npmCommand = 'npm run test:security'
        commandName = 'Security Tests'
        break
      case 'deps':
        npmCommand = 'npm run security:deps'
        commandName = 'Dependency Fix'
        break
      case 'lint':
        npmCommand = 'npm run lint'
        commandName = 'Code Linting'
        break
      case 'typecheck':
        npmCommand = 'npm run type-check'
        commandName = 'TypeScript Check'
        break
      case 'build':
        npmCommand = 'npm run build'
        commandName = 'Production Build'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid command' },
          { status: 400 }
        )
    }

    console.log(`🔒 Running security command: ${npmCommand}`)

    try {
      const output = execSync(npmCommand, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout for longer commands
      })

      return NextResponse.json({
        success: true,
        command: commandName,
        output: output,
        timestamp: new Date().toISOString()
      })

    } catch (error: any) {
      // Some security commands return non-zero exit codes even when successful
      const output = error.stdout || error.message || 'Command failed'
      
      return NextResponse.json({
        success: false,
        command: commandName,
        output: output,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('Security command API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute security command',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
