import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeadlineReminders } from '@/api/applications'
import type { ApplicationResponse } from '@/types'

const STORAGE_KEY = 'reminder_dismissed'

interface DismissedState {
  date: string
  ids: string[]
}

function getDismissedToday(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const stored: DismissedState = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    return stored.date === today ? stored.ids : []
  } catch {
    return []
  }
}

export function useDeadlineReminder() {
  const { data } = useQuery<ApplicationResponse[]>({
    queryKey: ['reminders', 'tomorrow'],
    queryFn: getDeadlineReminders,
    staleTime: 0,
  })

  const dismissedIds = getDismissedToday()
  const pendingReminders = (data ?? []).filter(a => !dismissedIds.includes(a.id))

  const dismiss = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    const ids = (data ?? []).map(a => a.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, ids }))
  }, [data])

  return { pendingReminders, dismiss }
}
