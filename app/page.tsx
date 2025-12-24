import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard/today')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">SENTINEL</div>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-zinc-400 hover:text-white transition"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl text-center space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Build habits.
              <br />
              Track progress.
              <br />
              <span className="text-zinc-500">Stay consistent.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Keyboard-first habit tracker with streaks, lifeboats, and zero friction logging.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="px-6 py-3 border border-zinc-700 font-medium rounded-lg hover:border-zinc-500 transition"
            >
              Learn More
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-zinc-800 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold">⌘K</div>
              <div className="text-sm text-zinc-500 mt-1">Keyboard first</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2s</div>
              <div className="text-sm text-zinc-500 mt-1">Log time</div>
            </div>
            <div>
              <div className="text-3xl font-bold">🛟</div>
              <div className="text-sm text-zinc-500 mt-1">Lifeboat system</div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="border-t border-zinc-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-3">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold">Command Center</h3>
              <p className="text-zinc-400">
                Type habit name, press Enter. Log in 2 seconds. No clicks, no navigation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3">
              <div className="text-4xl">🔥</div>
              <h3 className="text-xl font-semibold">Smart Streaks</h3>
              <p className="text-zinc-400">
                Lifeboats forgive missed days. Focus on density over perfection.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3">
              <div className="text-4xl">⌨️</div>
              <h3 className="text-xl font-semibold">Keyboard Native</h3>
              <p className="text-zinc-400">
                CMD+1/2/3 navigation. J/K selection. CMD+Z undo. Built for speed.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3">
              <div className="text-4xl">📊</div>
              <h3 className="text-xl font-semibold">Consistency Score</h3>
              <p className="text-zinc-400">
                Weighted scoring by importance. Track what matters, not vanity metrics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="space-y-3">
              <div className="text-4xl">🔧</div>
              <h3 className="text-xl font-semibold">Maintenance Tasks</h3>
              <p className="text-zinc-400">
                Separate recurring tasks from daily habits. Haircuts, renewals, errands.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="space-y-3">
              <div className="text-4xl">🔒</div>
              <h3 className="text-xl font-semibold">Private & Secure</h3>
              <p className="text-zinc-400">
                Row-level security. Your data is yours. No tracking, no ads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500">
          <p>SENTINEL © 2025. Built for consistency.</p>
        </div>
      </footer>
    </div>
  )
}
