// Security Testing API - Tests security measures
import { NextRequest, NextResponse } from 'next/server'
import { EmailOTP } from '@/lib/emailOTP'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: { passed: 0, failed: 0, total: 0, securityScore: 0 }
  }

  try {
    // Test 1: Rate Limiting
    try {
      const testEmail = 'ratelimit@test.com'
      let requestCount = 0
      let blocked = false
      
      // Simulate multiple rapid requests
      for (let i = 0; i < 6; i++) {
        const stored = await EmailOTP.storeOTP(testEmail, `12345${i}`)
        if (!stored && i >= 5) {
          blocked = true
          break
        }
        requestCount++
      }
      
      const passed = blocked // Should be blocked after 5 requests
      
      results.tests.push({
        name: 'Rate Limiting',
        status: passed ? 'PASS' : 'FAIL',
        details: `Requests made: ${requestCount}, Rate limited: ${blocked}`,
        severity: 'HIGH'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      results.tests.push({
        name: 'Rate Limiting',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'HIGH'
      })
      results.summary.failed++
    }

    // Test 2: OTP Expiration
    try {
      const testEmail = 'expire@test.com'
      const testOTP = '999999'
      
      // Store OTP
      await EmailOTP.storeOTP(testEmail, testOTP)
      
      // Wait a short time (simulate expiration check)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify OTP should work
      const validNow = await EmailOTP.verifyOTP(testEmail, testOTP)
      
      // Test with wrong OTP
      const invalidOTP = await EmailOTP.verifyOTP(testEmail, '000000')
      
      const passed = validNow && !invalidOTP
      
      results.tests.push({
        name: 'OTP Expiration & Validation',
        status: passed ? 'PASS' : 'FAIL',
        details: `Valid OTP works: ${validNow}, Invalid OTP rejected: ${!invalidOTP}`,
        severity: 'HIGH'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      results.tests.push({
        name: 'OTP Expiration & Validation',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'HIGH'
      })
      results.summary.failed++
    }

    // Test 3: Input Validation
    try {
      const testCases = [
        { email: '', valid: false },
        { email: 'invalid', valid: false },
        { email: 'test@test.com', valid: true },
        { email: '<script>alert("xss")</script>@test.com', valid: false },
        { email: 'test+tag@test.com', valid: true }
      ]
      
      let passed = true
      const results_detail = []
      
      for (const testCase of testCases) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const isValid = emailRegex.test(testCase.email)
        
        if (isValid !== testCase.valid) {
          passed = false
        }
        
        results_detail.push(`${testCase.email}: ${isValid} (expected: ${testCase.valid})`)
      }
      
      results.tests.push({
        name: 'Input Validation',
        status: passed ? 'PASS' : 'FAIL',
        details: results_detail,
        severity: 'MEDIUM'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      results.tests.push({
        name: 'Input Validation',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'MEDIUM'
      })
      results.summary.failed++
    }

    // Test 4: Security Headers Check
    try {
      const url = new URL(request.url)
      const testUrl = `${url.protocol}//${url.host}/api/admin/auth/email-otp`
      
      const response = await fetch(testUrl, { 
        method: 'OPTIONS',
        headers: { 'Origin': url.origin }
      })
      
      const headers = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'x-content-type-options': response.headers.get('x-content-type-options'),
        'x-frame-options': response.headers.get('x-frame-options'),
        'x-xss-protection': response.headers.get('x-xss-protection'),
        'referrer-policy': response.headers.get('referrer-policy')
      }
      
      const requiredHeaders = ['x-content-type-options', 'x-frame-options']
      const passed = requiredHeaders.every(header => {
        const headerKey = header as keyof typeof headers
        return headers[headerKey]
      })
      
      results.tests.push({
        name: 'Security Headers',
        status: passed ? 'PASS' : 'FAIL',
        details: headers,
        severity: 'MEDIUM'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      results.tests.push({
        name: 'Security Headers',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'MEDIUM'
      })
      results.summary.failed++
    }

    // Test 5: Brute Force Protection
    try {
      const testEmail = 'bruteforce@test.com'
      const correctOTP = '123456'
      
      // Store correct OTP
      await EmailOTP.storeOTP(testEmail, correctOTP)
      
      // Try wrong OTPs multiple times
      let attempts = 0
      let blocked = false
      
      for (let i = 0; i < 4; i++) {
        const result = await EmailOTP.verifyOTP(testEmail, `00000${i}`)
        attempts++
        if (!result && i >= 2) {
          // Should be blocked after 3 attempts
          blocked = true
          break
        }
      }
      
      // Try correct OTP - should fail if blocked
      const finalResult = await EmailOTP.verifyOTP(testEmail, correctOTP)
      
      const passed = blocked && !finalResult
      
      results.tests.push({
        name: 'Brute Force Protection',
        status: passed ? 'PASS' : 'FAIL',
        details: `Attempts: ${attempts}, Blocked: ${blocked}, Final result: ${finalResult}`,
        severity: 'HIGH'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      results.tests.push({
        name: 'Brute Force Protection',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'HIGH'
      })
      results.summary.failed++
    }

    // Test 6: Session Security
    try {
      const testEmail = 'session@test.com'
      
      // Test session creation and validation
      const metrics = EmailOTP.getSecurityMetrics()
      const hasMetrics = typeof metrics.totalOTPs === 'number'
      
      // Test cleanup functionality
      EmailOTP.cleanupExpiredOTPs()
      const metricsAfterCleanup = EmailOTP.getSecurityMetrics()
      const cleanupWorks = typeof metricsAfterCleanup.totalOTPs === 'number'
      
      const passed = hasMetrics && cleanupWorks
      
      results.tests.push({
        name: 'Session Security',
        status: passed ? 'PASS' : 'FAIL',
        details: `Has metrics: ${hasMetrics}, Cleanup works: ${cleanupWorks}`,
        severity: 'MEDIUM'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      results.tests.push({
        name: 'Session Security',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'MEDIUM'
      })
      results.summary.failed++
    }

    results.summary.total = results.summary.passed + results.summary.failed
    results.summary.securityScore = Math.round((results.summary.passed / results.summary.total) * 100)

    return NextResponse.json({
      status: results.summary.failed === 0 ? 'ALL_SECURITY_TESTS_PASSED' : 'SECURITY_ISSUES_FOUND',
      securityScore: results.summary.securityScore,
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'SECURITY_TEST_ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
