'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Wand2, AlertCircle } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  
  const [code, setCode] = useState<string>('def hello_world():\n    print("Hello, World!")')
  const [analysisResult, setAnalysisResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  // Bu fonksiyon gelen akışı işleyecek şekilde güncellendi
  const handleAnalyze = async () => {
    setIsLoading(true)
    setError(null)
    setAnalysisResult('') // Sonucu temizle

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Analiz sırasında bir hata oluştu.')
        setIsLoading(false)
        return
      }
      
      // Akışı (stream) okumak için bir 'reader' al
      if (!response.body) {
        setError('Response body is missing.')
        setIsLoading(false)
        return
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder() // Gelen veriyi metne çevirmek için

      // Akış bitene kadar döngüde kal
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          // Akış bitti
          break
        }
        
        // Gelen veri parçasını metne çevir
        const textChunk = decoder.decode(value, { stream: true })
        
        // Gelen metni, mevcut sonucun *sonuna* ekle (ChatGPT efekti)
        setAnalysisResult((prevResult) => prevResult + textChunk)
      }

      setIsLoading(false)

    } catch (err) {
      console.error('Analiz hatası:', err)
      setError('Bağlantı hatası. Sunucu çalışıyor mu?')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-12">
      {/* Header - Logout Butonu */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gradient">
          CodeRefine AI
        </h1>
        <button 
          onClick={handleLogout}
          className="glass-link text-sm font-medium flex items-center gap-2"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>

      {/* Ana Analiz Alanı */}
      <div className="w-full max-w-6xl glass rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Code Analyzer</h2>
        
        {/* Hata Mesajı Alanı */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center mb-4">
            <AlertCircle className="h-5 w-5 mr-3" />
            <span>{error}</span>
          </div>
        )}

        {/* Kod Giriş Alanı */}
        <div className="mb-4">
          <label htmlFor="codeInput" className="block text-sm font-medium text-gray-300 mb-2">
            Enter your code to analyze:
          </label>
          <textarea
            id="codeInput"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="def my_function(param1, param2): ..."
            className="w-full h-64 p-4 rounded-lg glass-input text-white font-mono text-sm"
          />
        </div>

        {/* Analiz Butonu */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="btn-gradient w-full py-3 rounded-lg font-semibold text-white text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="spinner mr-2"></div>
              Analyzing Code...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              Analyze Code
            </>
          )}
        </button>

        {/* Sonuç Alanı */}
        {(analysisResult || isLoading) && ( // Yüklenirken de göster
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-white mb-3">Analysis Result:</h3>
            <div className="glass-strong rounded-lg p-4 text-gray-200 whitespace-pre-wrap">
              {analysisResult}
              {/* Yüklenirken imleç efekti */}
              {isLoading && !analysisResult && (
                <span className="animate-pulse">|</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}