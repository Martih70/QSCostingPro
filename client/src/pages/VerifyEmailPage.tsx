import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setError('No verification token provided')
        setVerifying(false)
        return
      }

      try {
        const response = await api.post('/auth/verify-email', { token })
        if (response.data.success) {
          setSuccess(true)
          setTimeout(() => {
            navigate('/dashboard')
          }, 3000)
        } else {
          setError(response.data.error || 'Verification failed')
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Verification failed')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {verifying ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin">
                <svg className="w-12 h-12 text-khc-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address</p>
          </div>
        ) : success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Email verified!</h2>
            <p className="text-gray-600">Your email has been verified successfully. Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verification failed</h2>
            <p className="text-gray-600">{error || 'Unable to verify your email'}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full px-4 py-2 bg-khc-primary text-white rounded-lg hover:bg-khc-primary/90 transition-colors font-medium"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
