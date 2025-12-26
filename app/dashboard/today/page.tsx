'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Activity {
  id: string
  name: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  target_frequency: number
  description?: string | null
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

type Importance = 'low' | 'medium' | 'high' | 'critical'

// Custom hook to prevent stale closures
function useEvent<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  })
  
  return useCallback(((...args) => callbackRef.current(...args)) as T, [])
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
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    importance: 'medium' as Importance,
    target_frequency: 7
  })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const loadData = useCallback(async () => {
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
  }, [supabase, router])

  useEffect(() => {
    loadData()
    inputRef.current?.focus()
  }, [loadData])

  function startEdit(activity: Activity) {
    setEditingId(activity.id)
    setEditForm({
      name: activity.name,
      description: activity.description || '',
      importance: activity.importance,
      target_frequency: activity.target_frequency
    })
  }

  async function saveEdit(activityId: string) {
    const { error } = await supabase
      .from('activities')
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        importance: editForm.importance,
        target_frequency: editForm.target_frequency
      })
      .eq('id', activityId)

    if (!error) {
      setEditingId(null)
      loadData()
      showToast('Habit updated')
    }
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function deleteHabit(activityId: string) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)

    if (!error) {
      setDeleteConfirmId(null)
      loadData()
      showToast('Habit deleted')
    }
  }

  async function handleSubmitInternal() {
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

  async function handleUndoInternal() {
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

  // Stable event handlers that always use latest state
  const handleSubmit = useEvent(handleSubmitInternal)
  const handleUndo = useEvent(handleUndoInternal)

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
        if (e.key === 'Escape') {
          if (editingId) {
            cancelEdit()
          } else {
            setCommand('')
            setSelectedIndex(0)
          }
          return
        }
        if (e.key === 'Enter' && !editingId) {
          e.preventDefault()
          handleSubmit()
        }
        if (e.key === 'Enter' && editingId) {
          e.preventDefault()
          saveEdit(editingId)
        }
        return
      }

      // Block shortcuts during edit mode
      if (editingId) return

      if (e.key === 'e' && activities[selectedIndex]) {
        e.preventDefault()
        startEdit(activities[selectedIndex])
        return
      }

      if (e.shiftKey && e.key === 'D' && activities[selectedIndex]) {
        e.preventDefault()
        deleteHabit(activities[selectedIndex].id)
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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activities.length, handleSubmit, handleUndo, router, editingId, activities, selectedIndex])

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
          const isEditing = editingId === activity.id
          const isHovered = hoveredId === activity.id

          if (isEditing) {
            return (
              <div key={activity.id} className="px-4 py-2 bg-surface border-l-2 border-blue-500">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-transparent border-b border-zinc-700 text-sm outline-none mb-2 text-white"
                  autoFocus
                />
                <input
                  type="text"
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="w-full bg-transparent text-xs text-zinc-400 outline-none mb-2"
                />
                <div className="flex gap-2 items-center">
                  <select
                    value={editForm.importance}
                    onChange={e => setEditForm(prev => ({ ...prev, importance: e.target.value as Importance }))}
                    className="bg-zinc-900 text-xs px-2 py-1 rounded outline-none text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <input
                    type="number"
                    value={editForm.target_frequency}
                    onChange={e => setEditForm(prev => ({ ...prev, target_frequency: Number(e.target.value) }))}
                    min={1}
                    max={7}
                    className="bg-zinc-900 text-xs px-2 py-1 w-16 rounded outline-none text-white"
                  />
                  <span className="text-xs text-zinc-600">days/week</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => saveEdit(activity.id)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs text-zinc-400 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={activity.id}
              className={`px-4 py-1 flex flex-col cursor-pointer transition ${
                selected ? 'bg-surface' : 'hover:bg-surface/50'
              }`}
              onClick={() => {
                setCommand(activity.name)
                inputRef.current?.focus()
              }}
              onMouseEnter={() => setHoveredId(activity.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="h-8 flex items-center gap-3">
                <div
                  className={`w-1.5 h-1.5 rounded-sm ${
                    logged ? 'bg-blue-500' : 'border border-zinc-700'
                  }`}
                />
                <span className="flex-1 text-sm">{activity.name}</span>
                {(isHovered || selected) && !logged && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(activity)
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === activity.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteHabit(activity.id)
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete?
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(activity.id)
                          setTimeout(() => setDeleteConfirmId(null), 3000)
                        }}
                        className="text-xs text-zinc-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
                {streak > 0 && (
                  <span className="text-xs text-zinc-400">{streak}d</span>
                )}
              </div>
              {(isHovered || selected) && activity.description && (
                <div className="text-xs text-zinc-600 ml-5 pb-1 line-clamp-2">
                  {activity.description}
                </div>
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
