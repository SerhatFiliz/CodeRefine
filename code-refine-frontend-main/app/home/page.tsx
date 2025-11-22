'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Wand2, AlertCircle, Github, FileCode2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'

interface AnalysisResult {
  executive_summary: {
    overview: string
    quality_score: number
    key_strengths: string[]
    critical_issues: string[]
  }
  code_smells: {
    file: string
    severity: string
    issue: string
    recommendation: string
  }[]
  technical_debt: {
    category: string
    issue: string
    impact: string
  }[]
  refactoring_suggestions: {
    title: string
    description: string
    code_snippet?: string
  }[]
}

export default function HomePage() {
  const router = useRouter()

  const [repoUrl, setRepoUrl] = useState<string>('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  const handleAnalyze = async () => {
    if (!repoUrl.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Analysis failed')
      }

      const data = await response.json()
      setResult(data)

    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'Connection error. Is the server running?')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <FileCode2 className="h-6 w-6 text-purple-300" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
            CodeRefine AI
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-gray-300 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl space-y-8">

        {/* Input Section */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">GitHub Repository Analysis</h2>
            <p className="text-gray-400 text-lg">Enter a public GitHub repository URL to generate a comprehensive technical report.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Github className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 transition-all outline-none"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !repoUrl}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard Results */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Executive Summary Card */}
            <div className="md:col-span-3 glass-panel p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Executive Summary</h3>
                  <p className="text-gray-300">{result.executive_summary.overview}</p>
                </div>
                <div className="flex flex-col items-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-sm text-gray-400 uppercase tracking-wider">Quality Score</span>
                  <span className={`text-4xl font-bold ${getScoreColor(result.executive_summary.quality_score)}`}>
                    {result.executive_summary.quality_score}/10
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Key Strengths</h4>
                  <ul className="space-y-2">
                    {result.executive_summary.key_strengths.map((strength, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-400 font-semibold mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Critical Issues</h4>
                  <ul className="space-y-2">
                    {result.executive_summary.critical_issues.map((issue, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Code Smells Column */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center"><Zap className="w-5 h-5 mr-2 text-yellow-400" /> Code Smells</h3>
              {result.code_smells.map((smell, i) => (
                <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-2 py-1 rounded">{smell.file}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${smell.severity === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                      {smell.severity}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm mb-1">{smell.issue}</p>
                  <p className="text-gray-400 text-xs">{smell.recommendation}</p>
                </div>
              ))}
            </div>

            {/* Technical Debt & Refactoring */}
            <div className="md:col-span-2 space-y-6">

              {/* Technical Debt */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-orange-400" /> Technical Debt</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.technical_debt.map((debt, i) => (
                    <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase">{debt.category}</span>
                        <span className="text-xs text-orange-300">{debt.impact} Impact</span>
                      </div>
                      <p className="text-gray-200 text-sm">{debt.issue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refactoring Suggestions */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Wand2 className="w-5 h-5 mr-2 text-blue-400" /> Refactoring Suggestions</h3>
                <div className="space-y-4">
                  {result.refactoring_suggestions.map((suggestion, i) => (
                    <div key={i} className="glass-panel p-5 rounded-xl border border-white/5 bg-white/5">
                      <h4 className="text-lg font-semibold text-blue-200 mb-2">{suggestion.title}</h4>
                      <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
                      {suggestion.code_snippet && (
                        <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto border border-white/10">
                          <code className="text-xs font-mono text-gray-300">{suggestion.code_snippet}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}