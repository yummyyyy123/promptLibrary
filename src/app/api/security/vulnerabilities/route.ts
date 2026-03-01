import { NextRequest, NextResponse } from 'next/server'

// Security vulnerability data sources
const VULNERABILITY_SOURCES = {
  cve: 'https://cve.circl.lu/api/cve/',
  nvd: 'https://services.nvd.nist.gov/rest/json/cves/1.0/',
  github: 'https://api.github.com/advisories',
  oss: 'https://ossindex.sonatype.org/api/v3/vulnerabilities'
}

// Common security vulnerabilities to check against
const SECURITY_CHECKS = {
  owasp: [
    'A01: Broken Access Control',
    'A02: Cryptographic Failures',
    'A03: Injection',
    'A04: Insecure Design',
    'A05: Security Misconfiguration',
    'A06: Vulnerable and Outdated Components',
    'A07: Identification and Authentication Failures',
    'A08: Software and Data Integrity Failures',
    'A09: Security Logging and Monitoring Failures',
    'A10: Server-Side Request Forgery (SSRF)'
  ],
  dependencies: [
    'nextjs',
    'react',
    'typescript',
    'tailwindcss',
    'framer-motion',
    'lucide-react',
    'resend',
    '@supabase/supabase-js'
  ]
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching latest security vulnerabilities...')

    // Get current security status from our tests
    const securityTestResponse = await fetch(`${request.nextUrl.origin}/api/test/security`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    })
    
    const securityTestData = await securityTestResponse.json()
    
    // Simulate vulnerability data (in production, fetch from real sources)
    const vulnerabilityData = {
      timestamp: new Date().toISOString(),
      sources: VULNERABILITY_SOURCES,
      currentSecurityStatus: {
        score: securityTestData.securityScore || 0,
        issues: securityTestData.results?.summary?.failed || 0,
        status: securityTestData.status || 'UNKNOWN'
      },
      latestVulnerabilities: [
        {
          id: 'CVE-2024-12345',
          title: 'Next.js Server-Side Request Forgery',
          severity: 'HIGH',
          description: 'SSRF vulnerability in Next.js versions < 14.0.0',
          affected: ['nextjs'],
          patched: true,
          url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-12345'
        },
        {
          id: 'CVE-2024-67890',
          title: 'React Cross-Site Scripting',
          severity: 'MEDIUM',
          description: 'XSS vulnerability in React components',
          affected: ['react'],
          patched: true,
          url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-67890'
        },
        {
          id: 'CVE-2024-11111',
          title: 'TypeScript Code Injection',
          severity: 'CRITICAL',
          description: 'Code injection in TypeScript compiler',
          affected: ['typescript'],
          patched: false,
          url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-11111'
        }
      ],
      owaspTop10: SECURITY_CHECKS.owasp,
      dependencies: SECURITY_CHECKS.dependencies,
      recommendations: [
        'Update Next.js to latest version',
        'Review and update dependencies regularly',
        'Implement security headers',
        'Enable CORS properly',
        'Use HTTPS everywhere',
        'Implement rate limiting',
        'Add input validation',
        'Use secure authentication'
      ]
    }

    return NextResponse.json({
      success: true,
      data: vulnerabilityData,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Security vulnerability fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch security vulnerability data',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
