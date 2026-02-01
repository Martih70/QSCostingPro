import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useToast } from '../components/ui/ToastContainer'
import axios from 'axios'

interface PasswordResetStep {
  request: boolean
  reset: boolean
}

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const toast = useToast()

  const resetToken = searchParams.get('token')
  const [step, setStep] = useState<PasswordResetStep>({
    request: !resetToken,
    reset: !!resetToken,
  })

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Request Password Reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(
        'http://localhost:3000/api/v1/password-reset/request',
        { email }
      )

      if (response.data.success) {
        toast.success('Reset link sent! Check your email (and spam folder)')
        setEmail('')
        // Note: In production, user would click link in email
        // For testing, display the reset page
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request password reset')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(
        'http://localhost:3000/api/v1/password-reset/reset',
        {
          token: resetToken,
          newPassword,
        }
      )

      if (response.data.success) {
        toast.success('Password has been reset successfully!')
        setResetSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-khc-primary to-khc-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-khc-primary mb-2 text-center">
            Password Reset
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {step.request ? 'Request a password reset link' : 'Set your new password'}
          </p>

          {/* Request Reset Form */}
          {step.request && !resetSuccess && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@qscosting.local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-secondary disabled:bg-gray-400 transition-colors font-medium"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-gray-600 mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-khc-primary hover:underline font-medium">
                  Back to Login
                </Link>
              </p>
            </form>
          )}

          {/* Reset Password Form */}
          {step.reset && !resetSuccess && resetToken && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-secondary disabled:bg-gray-400 transition-colors font-medium"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Success Message */}
          {resetSuccess && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Password Reset!</h2>
              <p className="text-gray-600 mb-6">Your password has been successfully reset.</p>
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-secondary transition-colors font-medium"
              >
                Back to Login
              </Link>
            </div>
          )}

          {/* Request sent confirmation */}
          {step.request && resetSuccess && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-khc-primary mb-2">Check Your Email!</h2>
              <p className="text-gray-600 mb-6">
                A password reset link has been sent to your email address.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Note: In production, you would receive an email. For testing, the reset link is:
              </p>
              {resetToken && (
                <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
                  <p className="text-xs text-gray-600 break-all">{resetToken}</p>
                </div>
              )}
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-secondary transition-colors font-medium"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>

        {/* Support Link */}
        <div className="text-center mt-8">
          <p className="text-white text-sm">
            Need help?{' '}
            <a href="mailto:support@qscosting.local" className="underline hover:text-gray-200">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
