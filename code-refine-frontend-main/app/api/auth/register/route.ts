import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Register sayfasından gelen veriyi oku (name, email, password)
    const body = await request.json()
    const { name, email, password } = body

    // Adres, auth.py'deki @router.post("/signup")'a göre güncellendi.
    // main.py'deki prefix ile birleşince: /auth/signup
    const backendResponse = await fetch('http://backend:8000/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // auth.py'deki UserCreate şeması (email, password, full_name) ile eşleşiyor
      body: JSON.stringify({
        email: email,
        password: password,
        full_name: name, 
      }),
    })

    const data = await backendResponse.json()

    // 3. Backend'den hata gelirse (örn: email zaten kayıtlı - 400 hatası)
    if (!backendResponse.ok) {
      let errorMessage = data.detail || 'Kayıt başarısız oldu.'
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail[0].msg // Daha spesifik validasyon hatası
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // 4. Başarılı kayıttan sonra kullanıcı verisini frontend'e geri yolla
    return NextResponse.json(data)
  } catch (error) {
    console.error('Register API route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

