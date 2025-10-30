import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Frontend login sayfasından gelen JSON verisini oku (email, password)
    const { email, password } = await request.json()

    // Adres, auth.py'deki @router.post("/login")'a göre güncellendi.
    // main.py'deki prefix ile birleşince: /auth/login
    const response = await fetch('http://backend:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // auth.py'deki LoginRequest şemasına göre JSON gönder
      body: JSON.stringify({
        email: email,
        password: password
      }),
    })

    const data = await response.json()

    // 4. Backend'den gelen cevabı kontrol et
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Geçersiz kullanıcı adı veya şifre' },
        { status: response.status }
      )
    }

    // 5. Başarılıysa, token'ı frontend login sayfasına geri yolla
    return NextResponse.json(data)

  } catch (error) {
    console.error('Login API route hatası:', error)
    return NextResponse.json(
      { error: 'Sunucuda beklenmedik bir hata oluştu.' },
      { status: 500 }
    )
  }
}
