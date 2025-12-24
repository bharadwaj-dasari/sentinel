'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signOut } from '@/app/actions/auth'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => pathname === path

  // Detect OS for keyboard shortcut display
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierKey = e.metaKey || e.ctrlKey // ✅ Support both CMD and CTRL

      // CTRL/CMD + 1 = Command Center
      if (modifierKey && e.key === '1') {
        e.preventDefault()
        router.push('/dashboard/today')
      }
      // CTRL/CMD + 2 = Forge
      if (modifierKey && e.key === '2') {
        e.preventDefault()
        router.push('/dashboard/forge')
      }
      // CTRL/CMD + 3 = Maintenance
      if (modifierKey && e.key === '3') {
        e.preventDefault()
        router.push('/dashboard/maintenance')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return (
    <nav className="border-b border-zinc-800 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo/Brand */}
          <Link 
            href="/dashboard/today" 
            className="text-lg font-semibold tracking-tight hover:text-zinc-400 transition"
          >
            SENTINEL
          </Link>

          {/* Nav Links */}
          <div className="flex space-x-6">
            <Link
              href="/dashboard/today"
              className={`text-sm font-medium transition ${
                isActive('/dashboard/today')
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="text-zinc-600">{isMac ? '⌘' : 'Ctrl+'}1</span> Command Center
            </Link>

            <Link
              href="/dashboard/forge"
              className={`text-sm font-medium transition ${
                isActive('/dashboard/forge')
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="text-zinc-600">{isMac ? '⌘' : 'Ctrl+'}2</span> Forge
            </Link>

            <Link
              href="/dashboard/maintenance"
              className={`text-sm font-medium transition ${
                isActive('/dashboard/maintenance')
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="text-zinc-600">{isMac ? '⌘' : 'Ctrl+'}3</span> Maintenance
            </Link>

            {/* Divider */}
            <div className="border-l border-zinc-700" />

            {/* Logout */}
            <button
               type="button"
                 onClick={async () => {
                   await signOut()
                  }}
                className="text-sm font-medium text-zinc-400 hover:text-red-400 transition"
                  >
                Logout
                </button>

          </div>
        </div>
      </div>
    </nav>
  )
}
