'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, Smartphone, Key } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [use2FA, setUse2FA] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (use2FA) {
        // Redirect to 2FA login
        router.push('/admin/login/2fa')
      } else {
        // Traditional login (for backward compatibility)
        const response = await fetch('/api/admin/auth/check', {
          method: 'GET',
          headers: {
            'Cookie': document.cookie
          }
        })

        const data = await response.json()

        if (data.authenticated) {
          router.push('/admin')
        } else {
          setError('Invalid credentials')
        }
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
              Choose your preferred login method
            </p>
          </div>

          <div className="space-y-4">
            {/* Login Method Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setUse2FA(false)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  !use2FA
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Key className="w-4 h-4 inline mr-2" />
                Password Only
              </button>
              <button
                onClick={() => setUse2FA(true)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  use2FA
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 inline mr-2" />
                2FA Login
              </button>
            </div>

            {use2FA ? (
              <div className="text-center py-8">
                <Smartphone className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Enhanced security with password + SMS OTP verification
                </p>
                <button
                  onClick={() => router.push('/admin/login/2fa')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Continue with 2FA
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
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
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {use2FA ? '2FA provides enhanced security with password + SMS verification' : 'Traditional login with username and password'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
