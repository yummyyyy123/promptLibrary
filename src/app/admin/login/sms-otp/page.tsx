'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, Smartphone, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SMSOTPLogin() {
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    phone: '',
    otp: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [phoneLastFour, setPhoneLastFour] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/auth/sms-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: credentials.phone,
          action: 'send'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTempToken(data.tempToken)
        setPhoneLastFour(data.phoneLastFour)
        setStep('otp')
        startResendTimer(data.expiresIn)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerification = async () => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/auth/sms-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: credentials.phone,
          otp: credentials.otp,
          tempToken,
          action: 'verify'
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin')
      } else {
        setError(data.error || 'OTP verification failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/auth/sms-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: credentials.phone,
          action: 'send'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTempToken(data.tempToken)
        startResendTimer(data.expiresIn)
        setError('OTP resent successfully')
        setTimeout(() => setError(''), 3000)
      } else {
        setError(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startResendTimer = (seconds: number) => {
    setResendTimer(seconds)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatPhoneNumber = (phone: string) => {
    // Format as 09XX XXX XXXX
    if (phone.length === 10) {
      return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
    }
    return phone
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {step === 'login' ? 'Enter your phone number for OTP verification' : 'Enter the OTP sent to your phone'}
            </p>
          </div>

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={credentials.phone}
                    onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="09XXXXXXXX"
                    maxLength={10}
                    pattern="09[0-9]{9}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter your 10-digit mobile number (09XXXXXXXX format)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || credentials.phone.length !== 10}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You will receive a 6-digit OTP via SMS
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Standard SMS rates may apply
                </p>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Enter OTP Code
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code sent to {formatPhoneNumber(credentials.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3'))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={credentials.otp}
                  onChange={(e) => setCredentials({ ...credentials, otp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center text-2xl font-mono"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Number
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleOTPVerification}
                disabled={isLoading || credentials.otp.length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  OTP is valid for 5 minutes
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
