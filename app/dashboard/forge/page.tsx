'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Tab = 'habits' | 'maintenance'
type Importance = 'low' | 'medium' | 'high' | 'critical'
type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom_days'

export default function ForgePage() {
  const [tab, setTab] = useState<Tab>('habits')
  const [name, setName] = useState('')
  const [importance, setImportance] = useState<Importance>('medium')
  const [targetFrequency, setTargetFrequency] = useState(7)
  const [recurrence, setRecurrence] = useState<Recurrence>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(7)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
  }, [tab])

  async function createHabit() {
    if (!name.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      name: name.trim(),
      importance,
      target_frequency: targetFrequency,
    })

    if (!error) {
      showToast('Habit created')
      setName('')
      setImportance('medium')
      setTargetFrequency(7)
      inputRef.current?.focus()
    }
  }

  async function createMaintenanceTask() {
    if (!name.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('maintenance_tasks').insert({
      user_id: user.id,
      name: name.trim(),
      recurrence,
      recurrence_interval: recurrence === 'custom_days' ? recurrenceInterval : null,
      next_due_date: today,
    })

    if (!error) {
      showToast('Task created')
      setName('')
      setRecurrence('weekly')
      setRecurrenceInterval(7)
      inputRef.current?.focus()
    }
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function handleSubmit() {
    if (tab === 'habits') {
      createHabit()
    } else {
      createMaintenanceTask()
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-[#27272a] flex">
        <button
          onClick={() => setTab('habits')}
          className={`px-4 py-3 text-[14px] border-b-2 ${
            tab === 'habits'
              ? 'border-[#3b82f6] text-[#fafafa]'
              : 'border-transparent text-[#a1a1aa]'
          }`}
        >
          Habits
        </button>
        <button
          onClick={() => setTab('maintenance')}
          className={`px-4 py-3 text-[14px] border-b-2 ${
            tab === 'maintenance'
              ? 'border-[#3b82f6] text-[#fafafa]'
              : 'border-transparent text-[#a1a1aa]'
          }`}
        >
          Maintenance
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={tab === 'habits' ? 'Habit name' : 'Task name'}
          className="w-full bg-transparent border border-[#27272a] focus:border-[#3f3f46] outline-none px-3 py-2 text-[14px] rounded"
        />

        {tab === 'habits' && (
          <>
            <div className="space-y-2">
              <label className="text-[12px] text-[#a1a1aa]">Importance</label>
              <select
                value={importance}
                onChange={e => setImportance(e.target.value as Importance)}
                className="w-full bg-[#18181b] border border-[#27272a] px-3 py-2 text-[14px] rounded outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] text-[#a1a1aa]">Target frequency (days/week)</label>
              <input
                type="number"
                value={targetFrequency}
                onChange={e => setTargetFrequency(Number(e.target.value))}
                min={1}
                max={7}
                className="w-full bg-transparent border border-[#27272a] focus:border-[#3f3f46] outline-none px-3 py-2 text-[14px] rounded"
              />
            </div>
          </>
        )}

        {tab === 'maintenance' && (
          <>
            <div className="space-y-2">
              <label className="text-[12px] text-[#a1a1aa]">Recurrence</label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as Recurrence)}
                className="w-full bg-[#18181b] border border-[#27272a] px-3 py-2 text-[14px] rounded outline-none"
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom_days">Custom days</option>
              </select>
            </div>

            {recurrence === 'custom_days' && (
              <div className="space-y-2">
                <label className="text-[12px] text-[#a1a1aa]">Every (days)</label>
                <input
                  type="number"
                  value={recurrenceInterval}
                  onChange={e => setRecurrenceInterval(Number(e.target.value))}
                  min={1}
                  className="w-full bg-transparent border border-[#27272a] focus:border-[#3f3f46] outline-none px-3 py-2 text-[14px] rounded"
                />
              </div>
            )}
          </>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#fafafa] text-[#09090b] py-2 text-[14px] font-medium rounded hover:opacity-90"
        >
          Create
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181b] border border-[#27272a] px-3 py-2 rounded text-[12px]">
          {toast}
        </div>
      )}
    </div>
  )
}
