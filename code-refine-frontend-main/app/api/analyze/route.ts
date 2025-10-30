import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    // Backend'deki /analysis endpoint'ine isteği yönlendir
    const response = await fetch('http://backend:8000/analysis/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: code }), 
    })

    // Backend'den gelen yanıt artık JSON değil, bir akış (stream).
    // response.body'yi (yani akışı) doğrudan alıp tarayıcıya iletiyoruz.
    if (!response.ok) {
      // Hata durumunda, hatayı JSON olarak oku (eğer varsa)
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.detail || 'Kod analizi başarısız oldu' },
        { status: response.status }
      )
    }

    // Başarılıysa, akışı (response.body) doğrudan tarayıcıya yolla
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain', // Düz metin akışı yolluyoruz
      },
    })

  } catch (error) {
    console.error('Analyze API route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}