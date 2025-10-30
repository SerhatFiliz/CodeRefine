'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null) 

    try {
      // --- DÜZELTİLEN YER ---
      // Adresi '/api/auth/token' yerine '/api/auth/login' yaptık.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      // --- DÜZELTME SONU ---

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.')
        setIsLoading(false)
        return
      }

      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
      }

      console.log('Giriş başarılı:', data)
      setIsLoading(false)
      
      router.push('/home')

    } catch (err) {
      console.error('Beklenmedik bir hata oluştu:', err)
      setError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="glass rounded-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Welcome
            </h1>
            <p className="text-gray-300 text-sm">
              Sign in to continue to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
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
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  required
                  placeholder="Enter your email"
                  className="glass-input w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-white text-sm font-medium block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={(e) => {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).setCustomValidity('Please fill out this field')
                  }}
                  onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                  required
                  placeholder="Enter your password"
                  className="glass-input w-full pl-12 pr-12 py-3 rounded-lg text-white placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-purple-400 hover:text-purple-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-purple-400 hover:text-purple-300 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="glass-checkbox"
                />
                <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>
              <Link href="/forgot-password" className="glass-link text-sm font-medium">
                Forgot Password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="glass-link font-semibold">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
