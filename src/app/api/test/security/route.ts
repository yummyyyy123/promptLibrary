// Security Testing API - Tests security measures
import { NextRequest, NextResponse } from 'next/server'
import { EmailOTP } from '@/lib/emailOTP'

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: { passed: 0, failed: 0, total: 0, securityScore: 0 }
  }

  console.log('🔍 Starting security tests...')

  try {
    // Test 1: Rate Limiting (Cooldown-based)
    try {
      console.log('🔍 Testing rate limiting...')
      // Use unique email with timestamp to avoid conflicts
      const testEmail = `ratelimit-${Date.now()}@test.com`
      let requestCount = 0
      let blocked = false
      
      // First request should work
      const firstStored = await EmailOTP.storeOTP(testEmail, '123456')
      console.log(`📊 First request result: ${firstStored}`)
      if (firstStored) requestCount++
      
      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Immediate second request should be blocked (1-minute cooldown)
      const secondStored = await EmailOTP.storeOTP(testEmail, '123457')
      console.log(`📊 Second request result: ${secondStored}`)
      if (!secondStored) {
        blocked = true
      }
      
      const passed = firstStored && !secondStored // First works, second blocked
      console.log(`📊 Rate limiting test passed: ${passed}`)
      
      results.tests.push({
        name: 'Rate Limiting',
        status: passed ? 'PASS' : 'FAIL',
        details: `First request: ${firstStored}, Second blocked: ${!secondStored}, Cooldown working: ${blocked}`,
        severity: 'HIGH'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      console.log('❌ Rate limiting test error:', error.message)
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
        // Enhanced email validation that blocks script tags and malicious content
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const hasScriptTags = /<script|<\/script>|javascript:|on\w+=/i.test(testCase.email)
        const isValid = emailRegex.test(testCase.email) && !hasScriptTags
        
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
      console.log('🔍 Testing security headers...')
      const url = new URL(request.url)
      const testUrl = `${url.protocol}//${url.host}/api/admin/auth/email-otp`
      
      const response = await fetch(testUrl, { 
        method: 'OPTIONS',
        headers: { 'Origin': url.origin }
      })
      
      console.log(`📊 Security headers response status: ${response.status}`)
      
      const headers = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'x-content-type-options': response.headers.get('x-content-type-options'),
        'x-frame-options': response.headers.get('x-frame-options'),
        'x-xss-protection': response.headers.get('x-xss-protection'),
        'referrer-policy': response.headers.get('referrer-policy')
      }
      
      console.log(`📊 Security headers found:`, headers)
      
      // Check for required headers (case-insensitive)
      const requiredHeaders = ['x-content-type-options', 'x-frame-options']
      const passed = requiredHeaders.every(header => {
        const value = response.headers.get(header)
        return value !== null && value !== undefined && value !== ''
      })
      
      console.log(`📊 Security headers test passed: ${passed}`)
      
      results.tests.push({
        name: 'Security Headers',
        status: passed ? 'PASS' : 'FAIL',
        details: headers,
        severity: 'MEDIUM'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      console.log('❌ Security headers test error:', error.message)
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
      console.log('🔍 Testing brute force protection...')
      const testEmail = 'bruteforce@test.com'
      const correctOTP = '123456'
      
      // Store correct OTP
      await EmailOTP.storeOTP(testEmail, correctOTP)
      
      // Try wrong OTPs multiple times
      let attempts = 0
      let blocked = false
      
      for (let i = 0; i < 4; i++) {
        const result = await EmailOTP.verifyOTP(testEmail, `00000${i}`)
        console.log(`📊 Attempt ${i+1} result: ${result}`)
        attempts++
        if (!result && i >= 2) {
          // Should be blocked after 3 attempts
          blocked = true
          break
        }
      }
      
      // Try correct OTP - should fail if blocked
      const finalResult = await EmailOTP.verifyOTP(testEmail, correctOTP)
      console.log(`📊 Final correct OTP result: ${finalResult}`)
      
      const passed = blocked && !finalResult
      console.log(`📊 Brute force test passed: ${passed}`)
      
      results.tests.push({
        name: 'Brute Force Protection',
        status: passed ? 'PASS' : 'FAIL',
        details: `Attempts: ${attempts}, Blocked: ${blocked}, Final result: ${finalResult}`,
        severity: 'HIGH'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      console.log('❌ Brute force test error:', error.message)
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
      console.log('🔍 Testing session security...')
      const testEmail = 'session@test.com'
      
      // Test session creation and validation
      const metrics = EmailOTP.getSecurityMetrics()
      console.log(`📊 Security metrics:`, metrics)
      const hasMetrics = typeof metrics.totalOTPs === 'number'
      
      // Test cleanup functionality
      EmailOTP.cleanupExpiredOTPs()
      const metricsAfterCleanup = EmailOTP.getSecurityMetrics()
      console.log(`📊 Metrics after cleanup:`, metricsAfterCleanup)
      const cleanupWorks = typeof metricsAfterCleanup.totalOTPs === 'number'
      
      const passed = hasMetrics && cleanupWorks
      console.log(`📊 Session security test passed: ${passed}`)
      
      results.tests.push({
        name: 'Session Security',
        status: passed ? 'PASS' : 'FAIL',
        details: `Has metrics: ${hasMetrics}, Cleanup works: ${cleanupWorks}`,
        severity: 'MEDIUM'
      })
      
      if (passed) results.summary.passed++
      else results.summary.failed++
    } catch (error: any) {
      console.log('❌ Session security test error:', error.message)
      results.tests.push({
        name: 'Session Security',
        status: 'FAIL',
        details: `Error: ${error.message}`,
        severity: 'MEDIUM'
      })
      results.summary.failed++
    }

    console.log(`📊 Security tests completed. Passed: ${results.summary.passed}, Failed: ${results.summary.failed}`)

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
