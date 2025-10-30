'use client'

import { LogOut, CheckCircle2 } from 'lucide-react'
// Yönlendirme için useRouter'ı import ediyoruz
import { useRouter } from 'next/navigation' 

export default function HomePage() {
  const router = useRouter()

  const handleLogout = () => {
    // 1. Kaydedilen token'ı tarayıcı hafızasından sil
    localStorage.removeItem('access_token')

    // 2. Kullanıcıyı login sayfasına yönlendir
    // window.location.href yerine router.push kullanmak daha iyidir
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Main Welcome Card */}
        <div className="glass rounded-2xl p-8 md:p-10 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-strong mb-6 pulse-effect">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl font-bold text-gradient mb-3">
            Welcome!
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            Successfully logged in
          </p>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="btn-gradient w-full py-4 rounded-lg font-semibold text-white text-lg flex items-center justify-center gap-3"
          >
            <LogOut className="h-6 w-6" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}