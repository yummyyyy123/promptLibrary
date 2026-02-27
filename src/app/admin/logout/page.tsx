'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Shield } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-full flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white/20 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Logged Out</h1>
            <p className="text-gray-600 dark:text-gray-400">You have been successfully logged out of your admin panel.</p>
          </div>

          {/* Message */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6"
            >
              <LogOut className="w-12 h-12 text-emerald-600 mb-4" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">You are now logged out</p>
            </motion.div>
          </div>

          {/* Redirect Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-8">
              You will be redirected to the login page in a moment...
            </p>
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent border-b-emerald-600 rounded-full"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Protected with secure authentication
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
