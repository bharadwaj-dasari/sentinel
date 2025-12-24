'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function VerifyContent() {
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const exchangeCodeForSession = async () => {
      try {
        // Get code from URL
        const code = searchParams.get('code')
        
        if (code) {
          // Exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            setError(exchangeError.message)
            return
          }
          
          // Successfully authenticated
          router.push('/dashboard/today')
          return
        }

        // Check if already authenticated
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push('/dashboard/today')
        } else {
          setError('No authentication code found')
        }
      } catch (err) {
        setError('Authentication failed')
      }
    }

    exchangeCodeForSession()
  }, [searchParams, router, supabase.auth])

  return (
    <div className="space-y-4">
      {error ? (
        <>
          <div className="text-[14px]">Verification failed</div>
          <div className="text-[12px] text-[#a1a1aa]">{error}</div>
          <button
            onClick={() => router.push('/login')}
            className="text-[12px] text-[#3b82f6] hover:underline"
          >
            Back to login
          </button>
        </>
      ) : (
        <div className="text-[14px] text-[#a1a1aa]">Verifying...</div>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-[14px] text-[#a1a1aa]">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
