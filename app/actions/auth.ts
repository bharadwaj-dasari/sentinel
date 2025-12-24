'use server'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string | null

  if (!email) {
    return { ok: false, error: 'Email is required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'http://localhost:3001/api/auth/callback',
    },
  })

  console.log('signInWithOtp result:', { data, error }) // ⭐ IMPORTANT

  if (error) {
    // Return the *exact* message from Supabase
    return { ok: false, error: error.message || 'Unknown Supabase error' }
  }

  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
