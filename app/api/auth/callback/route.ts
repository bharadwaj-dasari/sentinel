import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  console.log('🔥 Callback hit, code:', code)

  if (!code) {
    console.error('❌ No code in URL')
    return NextResponse.redirect(`${origin}/auth/login?error=Missing+code`)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log('✅ Session created, redirecting to dashboard')
    return NextResponse.redirect(`${origin}/dashboard/today`)
  } catch (err) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(`${origin}/auth/login?error=Callback+failed`)
  }
}
