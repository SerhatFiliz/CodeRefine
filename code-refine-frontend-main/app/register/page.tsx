'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword') {
        setPasswordMatch(value === formData.password)
      } else {
        if (formData.confirmPassword) {
          setPasswordMatch(formData.confirmPassword === value)
        } else {
          setPasswordMatch(true)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false)
      return
    }

    setIsLoading(true)

    try {
      // 1. Doğru "köprü"ye, yani register API'sine istek at
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      // 2. Cevabı kontrol et
      if (!response.ok) {
        // Backend'den gelen hatayı (örn: 'Email already registered') göster
        setError(data.error || 'Kayıt başarısız. Lütfen tekrar deneyin.')
        setIsLoading(false)
        return
      }

      // 3. BAŞARILI!
      console.log('Kayıt başarılı:', data)
      setIsLoading(false)

      // Kullanıcıyı login sayfasına yönlendir
      router.push('/login')

    } catch (err) {
      // Network hatası veya beklenmedik bir hata
      console.error('Beklenmedik bir hata oluştu:', err)
      setError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Create Account
            </h1>
            <p className="text-gray-300 text-sm">
              Join us and start your journey today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-3" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-white text-sm font-medium block">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onInvalid={(e) => {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).setCustomValidity(
                      'Please fill out this field'
                    )
                  }}
                  onInput={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity('')
                  }
                  required
                  placeholder="Enter your full name"
                  className="glass-input w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>

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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
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
            </div>

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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onInvalid={(e) => {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).setCustomValidity(
                      'Please fill out this field'
                    )
                  }}
                  onInput={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity('')
                  }
                  required
                  placeholder="Create a password"
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

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-white text-sm font-medium block"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onInvalid={(e) => {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).setCustomValidity(
                      'Please fill out this field'
                    )
                  }}
                  onInput={(e) =>
                    (e.target as HTMLInputElement).setCustomValidity('')
                  }
                  required
                  placeholder="Confirm your password"
                  className={`glass-input w-full pl-12 pr-12 py-3 rounded-lg text-white placeholder-gray-400 ${
                    !passwordMatch && formData.confirmPassword
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-purple-400 hover:text-purple-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-purple-400 hover:text-purple-300 transition-colors" />
                  )}
                </button>
              </div>
              {!passwordMatch && formData.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {passwordMatch && formData.confirmPassword && (
                <p className="text-green-400 text-xs mt-1 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordMatch || !formData.confirmPassword}
              className="btn-gradient w-full py-3 rounded-lg font-semibold text-white text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <>
                  <div className="spinner mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-300 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="glass-link font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

