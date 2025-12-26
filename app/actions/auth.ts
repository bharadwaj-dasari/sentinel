'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    throw error
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw error
  }

  redirect('/login')
}
