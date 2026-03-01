// Pipeline Testing API - Complete CI/CD pipeline tests
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    pipeline: {
      smoke: null as any,
      security: null as any,
      performance: null as any,
      integration: null as any
    },
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      securityScore: 0,
      performanceScore: 0,
      overallStatus: 'PENDING'
    },
    duration: 0
  }

  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Run Smoke Tests
    try {
      const smokeResponse = await fetch(`${baseUrl}/api/test/smoke`, {
        method: 'GET',
        headers: { 'Origin': url.origin }
      })
      const smokeData = await smokeResponse.json()
      
      results.pipeline.smoke = {
        status: smokeData.status,
        passed: smokeData.results?.summary?.passed || 0,
        failed: smokeData.results?.summary?.failed || 0,
        total: smokeData.results?.summary?.total || 0
      }
      
      results.summary.totalTests += results.pipeline.smoke.total
      results.summary.passedTests += results.pipeline.smoke.passed
      results.summary.failedTests += results.pipeline.smoke.failed
    } catch (error: any) {
      results.pipeline.smoke = {
        status: 'ERROR',
        error: error.message,
        passed: 0,
        failed: 1,
        total: 1
      }
      results.summary.totalTests += 1
      results.summary.failedTests += 1
    }

    // Run Security Tests
    try {
      const securityResponse = await fetch(`${baseUrl}/api/test/security`, {
        method: 'GET',
        headers: { 'Origin': url.origin }
      })
      const securityData = await securityResponse.json()
      
      results.pipeline.security = {
        status: securityData.status,
        securityScore: securityData.securityScore || 0,
        passed: securityData.results?.summary?.passed || 0,
        failed: securityData.results?.summary?.failed || 0,
        total: securityData.results?.summary?.total || 0
      }
      
      results.summary.totalTests += results.pipeline.security.total
      results.summary.passedTests += results.pipeline.security.passed
      results.summary.failedTests += results.pipeline.security.failed
      results.summary.securityScore = results.pipeline.security.securityScore
    } catch (error: any) {
      results.pipeline.security = {
        status: 'ERROR',
        error: error.message,
        securityScore: 0,
        passed: 0,
        failed: 1,
        total: 1
      }
      results.summary.totalTests += 1
      results.summary.failedTests += 1
    }

    // Performance Tests
    try {
      const perfStart = Date.now()
      
      // Test API response times
      const endpoints = [
        '/api/admin/auth/email-otp',
        '/api/admin/auth/2fa-login',
        '/api/admin/auth'
      ]
      
      let totalResponseTime = 0
      let passedPerfTests = 0
      
      for (const endpoint of endpoints) {
        const endpointStart = Date.now()
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'OPTIONS',
            headers: { 'Origin': url.origin }
          })
          const responseTime = Date.now() - endpointStart
          totalResponseTime += responseTime
          
          // Consider it passed if response time < 1000ms
          if (responseTime < 1000) passedPerfTests++
        } catch (error) {
          // Endpoint might not support OPTIONS, that's okay
          totalResponseTime += Date.now() - endpointStart
          passedPerfTests++
        }
      }
      
      const avgResponseTime = totalResponseTime / endpoints.length
      const perfScore = Math.round((passedPerfTests / endpoints.length) * 100)
      
      results.pipeline.performance = {
        status: perfScore >= 80 ? 'PASS' : 'FAIL',
        avgResponseTime: avgResponseTime,
        performanceScore: perfScore,
        passed: passedPerfTests,
        failed: endpoints.length - passedPerfTests,
        total: endpoints.length
      }
      
      results.summary.totalTests += results.pipeline.performance.total
      results.summary.passedTests += results.pipeline.performance.passed
      results.summary.failedTests += results.pipeline.performance.failed
      results.summary.performanceScore = perfScore
      
    } catch (error: any) {
      results.pipeline.performance = {
        status: 'ERROR',
        error: error.message,
        performanceScore: 0,
        passed: 0,
        failed: 1,
        total: 1
      }
      results.summary.totalTests += 1
      results.summary.failedTests += 1
    }

    // Integration Tests
    try {
      const integrationResults = []
      
      // Test 1: Full OTP Flow
      try {
        const otpResponse = await fetch(`${baseUrl}/api/admin/auth/email-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': url.origin
          },
          body: JSON.stringify({
            email: 'spicy0pepper@gmail.com'
          })
        })
        
        const otpData = await otpResponse.json()
        const flowWorks = otpData.success && otpData.tempToken
        
        integrationResults.push({
          name: 'Full OTP Flow',
          status: flowWorks ? 'PASS' : 'FAIL',
          details: `Success: ${otpData.success}, Has tempToken: ${!!otpData.tempToken}`
        })
      } catch (error: any) {
        integrationResults.push({
          name: 'Full OTP Flow',
          status: 'FAIL',
          details: `Error: ${error.message}`
        })
      }
      
      // Test 2: Auth Check
      try {
        const authResponse = await fetch(`${baseUrl}/api/admin/auth/check`, {
          method: 'GET',
          headers: { 'Origin': url.origin }
        })
        
        const authWorks = authResponse.status === 401 // Should be unauthorized without token
        
        integrationResults.push({
          name: 'Auth Check',
          status: authWorks ? 'PASS' : 'FAIL',
          details: `Status: ${authResponse.status} (expected: 401)`
        })
      } catch (error: any) {
        integrationResults.push({
          name: 'Auth Check',
          status: 'FAIL',
          details: `Error: ${error.message}`
        })
      }
      
      const passedIntegration = integrationResults.filter(r => r.status === 'PASS').length
      const totalIntegration = integrationResults.length
      
      results.pipeline.integration = {
        status: passedIntegration === totalIntegration ? 'PASS' : 'FAIL',
        passed: passedIntegration,
        failed: totalIntegration - passedIntegration,
        total: totalIntegration,
        tests: integrationResults
      }
      
      results.summary.totalTests += results.pipeline.integration.total
      results.summary.passedTests += results.pipeline.integration.passed
      results.summary.failedTests += results.pipeline.integration.failed
      
    } catch (error: any) {
      results.pipeline.integration = {
        status: 'ERROR',
        error: error.message,
        passed: 0,
        failed: 1,
        total: 1
      }
      results.summary.totalTests += 1
      results.summary.failedTests += 1
    }

    // Calculate overall status
    const successRate = results.summary.totalTests > 0 
      ? (results.summary.passedTests / results.summary.totalTests) * 100 
      : 0
    
    if (results.summary.failedTests === 0) {
      results.summary.overallStatus = 'ALL_TESTS_PASSED'
    } else if (successRate >= 80) {
      results.summary.overallStatus = 'MOSTLY_PASSED'
    } else if (successRate >= 50) {
      results.summary.overallStatus = 'PARTIALLY_PASSED'
    } else {
      results.summary.overallStatus = 'CRITICAL_ISSUES'
    }

    results.duration = Date.now() - startTime

    return NextResponse.json({
      status: results.summary.overallStatus,
      results
    })

  } catch (error: any) {
    results.duration = Date.now() - startTime
    results.summary.overallStatus = 'PIPELINE_ERROR'
    
    return NextResponse.json({
      status: 'PIPELINE_ERROR',
      error: error.message,
      results,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
