"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Code2, Sparkles, Shield, AlertTriangle, CheckCircle, Clock, ArrowRight, Activity, Zap, Layers, Bug, Lightbulb } from 'lucide-react'

// --- Models ---
const MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Balanced)' },
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B (Competitor)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' }
]

// --- Interfaces ---
interface CodeSmell {
  file: string; severity: string; description: string; suggestion: string;
}
interface TechDebt {
  category: string; impact: string; description: string;
}
interface Refactoring {
  title: string; description: string; code_before?: string; code_after?: string;
}
interface LLMReport {
  executive_summary: string
  key_strengths: string[]; critical_issues: string[]; quality_score: number;
  code_smells: CodeSmell[]; technical_debt: TechDebt[]; refactoring_suggestions: Refactoring[];
  security_analysis: string;
}
interface AnalysisResult {
  report: string; repo_name: string;
  static_analysis?: {
    complexity: { average_score: string; average_value: number };
    security: { score: number; issues: { filename: string; issue_text: string; severity: string; line_number: number; code: string }[] };
  }
}

export default function Home() {
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [parsedReport, setParsedReport] = useState<LLMReport | null>(null)
  const [error, setError] = useState('')
  const [modelId, setModelId] = useState(MODELS[0].id)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) timer = setInterval(() => setCountdown(p => p - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    if (result?.report) {
      try {
        const parsed = JSON.parse(result.report)
        setParsedReport(parsed)
      } catch (e) {
        console.error("Failed to parse LLM JSON:", e)
        setParsedReport({
            executive_summary: result.report,
            key_strengths: [], critical_issues: [], quality_score: 0, 
            code_smells: [], technical_debt: [], refactoring_suggestions: [], security_analysis: ""
        })
      }
    }
  }, [result])

  const handleAnalyze = async () => {
    if (!repoUrl) return
    setLoading(true); setError(''); setResult(null); setParsedReport(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl, model_id: modelId }),
      })
      const data = await response.json()
      if (response.status === 429 || response.status === 413) {
        setCountdown(60); setError(`System busy (Rate Limit). Retrying in 60s...`); setLoading(false); return
      }
      if (!response.ok) {
        const msg = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || 'Analysis failed');
        throw new Error(msg)
      }
      setResult(data)
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred') } finally { setLoading(false) }
  }

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
  const getScoreColor = (score: number) => score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
  const getSeverityColor = (sev: string) => {
      const s = sev.toLowerCase();
      if(s.includes('high') || s.includes('critical')) return 'bg-red-500/10 text-red-200 border-red-500/30 border';
      if(s.includes('medium')) return 'bg-yellow-500/10 text-yellow-200 border-yellow-500/30 border';
      return 'bg-blue-500/10 text-blue-200 border-blue-500/30 border';
  }

  return (
    <main className="min-h-screen bg-[#2D0B59] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl"><Code2 className="w-8 h-8 text-pink-400" /></div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-purple-300">CodeRefine AI</h1>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center gap-2"><LogOut className="w-4 h-4"/> Logout</button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-center mb-2">GitHub Repository Analysis</h2>
            <p className="text-center text-purple-200 mb-8">Generate comprehensive technical reports powered by Hybrid LLM Architecture.</p>
            {error && <div className="bg-red-500/20 text-red-200 p-4 rounded-xl mb-6 flex gap-3"><AlertTriangle/> {error}</div>}
            <div className="flex flex-col md:flex-row gap-4">
                <select value={modelId} onChange={e => setModelId(e.target.value)} className="bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white md:w-1/3">
                    {MODELS.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)}
                </select>
                <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="[https://github.com/username/repo](https://github.com/username/repo)" className="bg-black/40 border border-white/20 rounded-xl px-4 py-3 flex-1 text-white" />
            </div>
            {countdown > 0 && <div className="mt-4 bg-yellow-500/20 text-yellow-300 p-3 rounded-xl flex justify-center gap-2"><Clock className="animate-spin-slow"/> Rate limit hit. Wait {countdown}s...</div>}
            <button onClick={handleAnalyze} disabled={loading || !repoUrl || countdown > 0} className={`w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${loading ? 'opacity-50' : ''}`}>
                {loading ? 'Analyzing Architecture...' : 'Generate Hybrid Report'}
            </button>
        </div>

        {result && parsedReport && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-yellow-400"/> Executive Summary</h3>
                        <p className="text-gray-300 leading-relaxed mb-6">{parsedReport.executive_summary}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-green-400 font-semibold mb-2 flex gap-2"><CheckCircle className="w-4 h-4"/> Key Strengths</h4>
                                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                    {parsedReport.key_strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-red-400 font-semibold mb-2 flex gap-2"><AlertTriangle className="w-4 h-4"/> Critical Issues</h4>
                                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                    {parsedReport.critical_issues.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
                            <span className="text-gray-400 text-sm uppercase tracking-wider">Quality Score</span>
                            <div className={`text-6xl font-bold mt-2 ${getScoreColor(parsedReport.quality_score)}`}>{parsedReport.quality_score}/100</div>
                        </div>
                        {result.static_analysis && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <Shield className="w-6 h-6 mx-auto text-purple-400 mb-2"/><div className="text-2xl font-bold">{result.static_analysis.security.score}</div><div className="text-xs text-gray-500">Bandit Score</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <Activity className="w-6 h-6 mx-auto text-pink-400 mb-2"/><div className="text-2xl font-bold">{result.static_analysis.complexity.average_score}</div><div className="text-xs text-gray-500">Radon Grade</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-purple-400"/> Hybrid Security Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Static Analysis Findings (Bandit)</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {result.static_analysis?.security.issues.map((issue, idx) => (
                                    <div key={idx} className="bg-red-900/20 border border-red-900/40 p-3 rounded-lg text-sm mb-2">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-red-300 font-mono text-xs">{issue.filename}:{issue.line_number}</span>
                                            <span className="px-2 py-0.5 bg-red-500/20 text-red-200 text-[10px] rounded uppercase font-bold">{issue.severity}</span>
                                        </div>
                                        <p className="text-gray-300">{issue.issue_text}</p>
                                    </div>
                                ))}
                                {(!result.static_analysis?.security.issues.length) && <p className="text-green-400 text-sm">No static vulnerabilities found.</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">AI Security Assessment</h4>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{parsedReport.security_analysis}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Bug className="text-yellow-400"/> Code Smells</h3>
                        <div className="space-y-3">
                            {parsedReport.code_smells.map((smell, i) => (
                                <div key={i} className={`p-4 rounded-xl ${getSeverityColor(smell.severity)}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono text-xs opacity-70">{smell.file}</span>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-black/20 rounded">{smell.severity}</span>
                                    </div>
                                    <p className="font-semibold text-sm mb-1">{smell.description}</p>
                                    <p className="text-xs opacity-80 italic">Tip: {smell.suggestion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Layers className="text-blue-400"/> Technical Debt</h3>
                        <div className="space-y-3">
                            {parsedReport.technical_debt.map((debt, i) => (
                                <div key={i} className="bg-gray-800/40 p-4 rounded-xl border border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-blue-300 font-bold text-xs uppercase">{debt.category}</span>
                                        <span className="text-xs text-gray-500">{debt.impact} Impact</span>
                                    </div>
                                    <p className="text-sm text-gray-300">{debt.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Lightbulb className="text-green-400"/> Refactoring Suggestions</h3>
                    <div className="space-y-6">
                        {parsedReport.refactoring_suggestions.map((ref, i) => (
                            <div key={i} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5">
                                    <h4 className="font-bold text-lg text-green-300">{ref.title}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{ref.description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                                    <div className="p-4 bg-[#1e1e1e] overflow-x-auto">
                                        <span className="text-xs text-red-400 uppercase font-bold tracking-wider mb-2 block">Before</span>
                                        <pre className="text-xs text-gray-300 font-mono"><code>{ref.code_before || "// No code snippet provided"}</code></pre>
                                    </div>
                                    <div className="p-4 bg-[#1e1e1e] overflow-x-auto">
                                        <span className="text-xs text-green-400 uppercase font-bold tracking-wider mb-2 block">After</span>
                                        <pre className="text-xs text-green-100 font-mono"><code>{ref.code_after || "// No code snippet provided"}</code></pre>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </main>
  )
}