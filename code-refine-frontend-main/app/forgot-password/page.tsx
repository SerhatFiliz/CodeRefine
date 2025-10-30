'use client'

import { useState } from 'react'
import Link from 'next/link'
// AlertCircle'ı hata gösterimi için ekliyoruz
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  // Hata mesajlarını tutmak için yeni state
  const [error, setError] = useState<string | null>(null)

  // --- BURASI DEĞİŞTİ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null) // Önceki hataları temizle

    try {
      // 1. Kendi Next.js API rotamıza (köprüye) istek at
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      // 2. Cevabı kontrol et
      if (!response.ok) {
        // Backend'den gelen hatayı (örn: 'Email not found') göster
        setError(data.error || 'Failed to send reset link.')
        setIsLoading(false)
        return
      }

      // 3. BAŞARILI! "Check Your Email" ekranını göster
      setIsLoading(false)
      setIsSuccess(true)

    } catch (err) {
      // Network hatası veya beklenmedik bir hata
      console.error('An unexpected error occurred:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }
  // --- DEĞİŞİKLİĞİN SONU ---

  const handleTryAgain = () => {
    setIsSuccess(false)
    setError(null) // Hataları temizle
    setEmail('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Main Forgot Password Card */}
        <div className="glass rounded-2xl p-8 md:p-10">
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-strong mb-4">
                  <Mail className="h-8 w-8 text-purple-400" />
                </div>
                <h1 className="text-4xl font-bold text-gradient mb-2">
                  Forgot Password?
                </h1>
                <p className="text-gray-300 text-sm">
                  No worries, we'll send you reset instructions
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* HATA MESAJI GÖSTERME ALANI */}
                {error && (
                  <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-white text-sm font-medium block">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onInvalid={(e) => {
                        e.preventDefault()
                        const target = e.target as HTMLInputElement
                        if (target.validity.valueMissing) {
                          target.setCustomValidity('Please fill out this field')
                        } else if (target.validity.typeMismatch) {
                          target.setCustomValidity('Please enter a valid email address')
                        }
                      }}
                      onInput={(e) =>
                        (e.target as HTMLInputElement).setCustomValidity('')
                      }
                      required
                      placeholder="Enter your email"
                      className="glass-input w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-400"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Enter the email associated with your account
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gradient w-full py-3 rounded-lg font-semibold text-white text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-8">
                <Link
                  href="/login"
                  className="flex items-center justify-center text-gray-300 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm">Back to Login</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-strong mb-6 pulse-effect">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-gradient mb-3">
                  Check Your Email
                </h2>
                <p className="text-gray-300 text-sm mb-2">
                  We've sent a password reset link to
                </p>
                <p className="text-purple-400 font-medium mb-6">
                  {email}
                </p>

                {/* Success Message */}
                <div className="success-message mb-6">
                  <p className="text-sm">
                    Please check your inbox and click on the link to reset your
                    password. The link will expire in 24 hours.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="btn-gradient w-full py-3 rounded-lg font-semibold text-white text-base flex items-center justify-center"
                  >
                    Back to Login
                  </Link>

                  <button
                    onClick={handleTryAgain}
                    className="w-full py-3 rounded-lg font-medium text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>

                {/* Help Text */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <p className="text-gray-400 text-xs">
                    Still having trouble? Contact our{' '}
                    <a href="#" className="glass-link">
                      support team
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}