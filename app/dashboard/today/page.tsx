'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Activity {
  id: string
  name: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  target_frequency: number
}

interface Streak {
  id: string
  activity_id: string
  current_count: number
}

interface Log {
  id: string
  activity_id: string
}

export default function CommandCenter() {
  const [command, setCommand] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lastLogId, setLastLogId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
    inputRef.current?.focus()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierKey = e.metaKey || e.ctrlKey

      if (modifierKey && e.key === 'n') {
        e.preventDefault()
        router.push('/dashboard/forge')
      }

      if (modifierKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }

      if (document.activeElement?.tagName === 'INPUT') {
        return
      }

      if (e.key === 'Escape') {
        setCommand('')
        setSelectedIndex(0)
      }

      if (e.key === 'j') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, activities.length - 1))
      }

      if (e.key === 'k') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }

      if (e.key === 'Enter' && command.trim()) {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [command, activities, router])

  async function loadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const [activitiesRes, streaksRes, logsRes, profileRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('is_archived', false)
        .order('name'),
      supabase
        .from('streaks')
        .select('*')
        .eq('status', 'active'),
      supabase
        .from('logs')
        .select('id, activity_id')
        .eq('log_date', today),
      supabase
        .from('profiles')
        .select('consistency_score')
        .eq('id', user.id)
        .single()
    ])

    setActivities(activitiesRes.data || [])
    setStreaks(streaksRes.data || [])
    setLogs(logsRes.data || [])
    setScore(profileRes.data?.consistency_score || 0)
    setLoading(false)
  }

  async function handleSubmit() {
    if (!command.trim()) return

    const match = activities.find(a => 
      a.name.toLowerCase().includes(command.toLowerCase())
    )

    if (!match) {
      showToast('No match')
      return
    }

    const alreadyLogged = logs.some(l => l.activity_id === match.id)
    if (alreadyLogged) {
      showToast('Already logged')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('logs')
      .insert({
        user_id: user.id,
        activity_id: match.id,
        log_date: today
      })
      .select()
      .single()

    if (!error && data) {
      setLastLogId(data.id)
      setLogs(prev => [...prev, data])
      setCommand('')
      showToast('Logged. Ctrl+Z to undo')
      loadData()
    }
  }

  async function handleUndo() {
    if (!lastLogId) return

    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', lastLogId)

    if (!error) {
      setLastLogId(null)
      loadData()
      showToast('Undone')
    }
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function getStreak(activityId: string) {
    return streaks.find(s => s.activity_id === activityId)?.current_count || 0
  }

  function isLogged(activityId: string) {
    return logs.some(l => l.activity_id === activityId)
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center text-center p-8">
        <div className="text-lg text-white mb-4">No activities yet</div>
        <div className="text-sm text-zinc-400 mb-6">
          Press Ctrl+N to create your first activity
        </div>
        <button
          onClick={() => router.push('/dashboard/forge')}
          className="bg-white text-black px-4 py-2 text-sm rounded hover:bg-zinc-200 transition"
        >
          Go to Forge
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-zinc-800 px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={e => setCommand(e.target.value)}
          placeholder="Type activity name..."
          className="w-full bg-transparent text-lg outline-none caret-blue-500 placeholder:text-zinc-600"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activities.map((activity, idx) => {
          const logged = isLogged(activity.id)
          const streak = getStreak(activity.id)
          const selected = idx === selectedIndex

          return (
            <div
              key={activity.id}
              className={`h-8 px-4 flex items-center gap-3 cursor-pointer transition ${
                selected ? 'bg-surface' : 'hover:bg-surface/50'
              }`}
              onClick={() => {
                setCommand(activity.name)
                inputRef.current?.focus()
              }}
            >
              <div
                className={`w-1.5 h-1.5 rounded-sm ${
                  logged ? 'bg-blue-500' : 'border border-zinc-700'
                }`}
              />
              <span className="flex-1 text-sm">{activity.name}</span>
              {streak > 0 && (
                <span className="text-xs text-zinc-400">{streak}d</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-400">
        {logs.length}/{activities.length} · {score.toFixed(0)}%
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-surface border border-zinc-700 px-3 py-2 rounded text-xs shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
