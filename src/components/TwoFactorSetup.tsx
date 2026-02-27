'use client'

import { useState } from 'react'
import { Shield, Smartphone, Key, Copy, Check, X } from 'lucide-react'

interface TwoFactorSetupProps {
  onClose: () => void
  onSetupComplete: () => void
}

export default function TwoFactorSetup({ onClose, onSetupComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)
  const [error, setError] = useState('')

  const setup2FA = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to setup 2FA')
      }

      const data = await response.json()
      setSecret(data.secret)
      setQrCode(data.qrDataURL)
      setBackupCodes(data.backupCodes)
      setStep('verify')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/2fa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ totpCode })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to verify 2FA')
      }

      onSetupComplete()
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text)
    if (type === 'secret') {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } else {
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Enable Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Add an extra layer of security to your admin account by requiring a verification code from your mobile device.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Setup Instructions:</h3>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>1. Click "Generate 2FA Secret" below</li>
                <li>2. Scan the QR code with Google Authenticator or similar app</li>
                <li>3. Save your backup codes in a secure location</li>
                <li>4. Enter the verification code to enable 2FA</li>
              </ol>
            </div>

            <button
              onClick={setup2FA}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate 2FA Secret'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">QR Code</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={qrCode} alt="QR Code" className="w-full h-auto" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan this QR code with Google Authenticator, Authy, or similar app
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Secret Key</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={secret}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(secret, 'secret')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If you can't scan the QR code, enter this key manually
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Backup Codes</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      Save these backup codes in a secure location. You can use them to access your account if you lose your device.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-yellow-300 dark:border-yellow-700">
                          {code}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                      className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100"
                    >
                      {copiedCodes ? 'Copied!' : 'Copy All Codes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Verify Setup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Enter the 6-digit code from your authenticator app to complete setup
                </p>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={verify2FA}
                  disabled={loading || totpCode.length !== 6}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
