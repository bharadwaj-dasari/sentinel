'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setStatus('loading')
    setError(null)

    const res = await login(formData)

    if (!res.ok) {
      setStatus('error')
      setError(res.error ?? 'Error sending magic link')
      return
    }

    setStatus('success')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block text-sm text-zinc-400 hover:text-white transition mb-4"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to SENTINEL</h1>
          <p className="text-zinc-400">
            Sign in with a magic link.
          </p>
        </div>

        {/* Messages */}
        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded">
            Magic link sent. Check your email.
          </div>
        )}

        {status === 'error' && error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={status === 'loading'}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-surface border border-zinc-700 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent
                         text-white placeholder:text-zinc-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-white text-black font-medium rounded-lg 
                       hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <p className="text-xs text-zinc-500 text-center">
          For local dev, Supabase may limit emails to 2 per hour. If you stop receiving
          emails, wait or check Auth logs in the Supabase dashboard.
        </p>
      </div>
    </div>
  )
}
