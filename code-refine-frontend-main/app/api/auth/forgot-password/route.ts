import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // --- DÜZELTİLEN SATIR ---
    // Adres '.../api/auth/password-recovery' DEĞİL, '.../auth/password-recovery' olmalı
    // Not: Bu adresin (password-recovery) 'auth.router' içinde tanımlı olması gerekir.
    const response = await fetch('http://backend:8000/auth/password-recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
    // --- DÜZELTME SONU ---

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to send reset email.' },
        { status: response.status }
      )
    }
    
    return NextResponse.json({ message: 'Password reset email sent (or processing).' })

  } catch (error) {
    console.error('Forgot Password API route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
