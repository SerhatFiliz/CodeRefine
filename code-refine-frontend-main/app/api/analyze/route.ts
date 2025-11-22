import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { repo_url } = body

    if (!repo_url) {
      return NextResponse.json(
        { error: 'Repo URL is required' },
        { status: 400 }
      )
    }

    // Forward request to backend
    const response = await fetch('http://backend:8000/analysis/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repo_url }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Analysis failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Analyze API route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}