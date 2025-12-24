'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MaintenanceTask {
  id: string
  name: string
  next_due_date: string | null
  last_completed_at: string | null
}

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    const { data } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('is_archived', false)
      .order('next_due_date', { ascending: true, nullsFirst: false })

    setTasks(data || [])
  }

  async function completeTask(taskId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/maintenance-complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ task_id: taskId }),
      }
    )

    if (response.ok) {
      showToast('Completed')
      loadTasks()
    }
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function getDaysUntil(dateString: string | null): string {
    if (!dateString) return ''

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dueDate = new Date(dateString)
    dueDate.setHours(0, 0, 0, 0)

    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`
    if (diffDays === 0) return 'Due today'
    return `Due in ${diffDays}d`
  }

  const overdue = tasks.filter(t => {
    if (!t.next_due_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(t.next_due_date) < today
  })

  const dueToday = tasks.filter(t => {
    if (!t.next_due_date) return false
    const today = new Date().toISOString().split('T')[0]
    return t.next_due_date === today
  })

  const upcoming = tasks.filter(t => {
    if (!t.next_due_date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(t.next_due_date) > today
  })

  return (
    <div className="h-screen flex flex-col overflow-y-auto">
      {overdue.length > 0 && (
        <div>
          <div className="px-4 py-3 text-[12px] text-[#fafafa] border-b border-[#27272a]">
            OVERDUE
          </div>
          {overdue.map(task => (
            <div
              key={task.id}
              className="h-[32px] px-4 flex items-center gap-3 border-b border-[#27272a]"
            >
              <span className="flex-1 text-[14px]">{task.name}</span>
              <span className="text-[12px] text-[#3b82f6]">
                {getDaysUntil(task.next_due_date)}
              </span>
              <button
                onClick={() => completeTask(task.id)}
                className="text-[12px] text-[#a1a1aa] hover:text-[#fafafa]"
              >
                Complete
              </button>
            </div>
          ))}
        </div>
      )}

      {dueToday.length > 0 && (
        <div>
          <div className="px-4 py-3 text-[12px] text-[#a1a1aa] border-b border-[#27272a]">
            DUE TODAY
          </div>
          {dueToday.map(task => (
            <div
              key={task.id}
              className="h-[32px] px-4 flex items-center gap-3 border-b border-[#27272a]"
            >
              <span className="flex-1 text-[14px]">{task.name}</span>
              <span className="text-[12px] text-[#a1a1aa]">
                {getDaysUntil(task.next_due_date)}
              </span>
              <button
                onClick={() => completeTask(task.id)}
                className="text-[12px] text-[#a1a1aa] hover:text-[#fafafa]"
              >
                Complete
              </button>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="px-4 py-3 text-[12px] text-[#a1a1aa] border-b border-[#27272a]">
            UPCOMING
          </div>
          {upcoming.map(task => (
            <div
              key={task.id}
              className="h-[32px] px-4 flex items-center gap-3 border-b border-[#27272a]"
            >
              <span className="flex-1 text-[14px] text-[#a1a1aa]">{task.name}</span>
              <span className="text-[12px] text-[#a1a1aa]">
                {getDaysUntil(task.next_due_date)}
              </span>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181b] border border-[#27272a] px-3 py-2 rounded text-[12px]">
          {toast}
        </div>
      )}
    </div>
  )
}
