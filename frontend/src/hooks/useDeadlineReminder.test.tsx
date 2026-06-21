import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDeadlineReminder } from '@/hooks/useDeadlineReminder'
import type { ApplicationResponse } from '@/types'

vi.mock('@/api/applications', () => ({
  getDeadlineReminders: vi.fn(),
}))

import { getDeadlineReminders } from '@/api/applications'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function sampleApp(id: string): ApplicationResponse {
  return {
    id,
    companyName: 'Test Corp',
    jobTitle: 'Dev',
    status: 'APPLIED',
    appliedDate: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    noteCount: 0,
    attachmentCount: 0,
  }
}

describe('useDeadlineReminder', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty pendingReminders before the query resolves', () => {
    vi.mocked(getDeadlineReminders).mockImplementation(
      (): Promise<ApplicationResponse[]> => new Promise(() => {}),
    )
    const { result } = renderHook(() => useDeadlineReminder(), { wrapper: makeWrapper() })
    expect(result.current.pendingReminders).toEqual([])
  })

  it('returns empty pendingReminders when the API returns an empty list', async () => {
    vi.mocked(getDeadlineReminders).mockResolvedValue([])
    const { result } = renderHook(() => useDeadlineReminder(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.pendingReminders).toEqual([]))
  })

  it('returns all reminders when none are dismissed', async () => {
    vi.mocked(getDeadlineReminders).mockResolvedValue([sampleApp('1'), sampleApp('2')])
    const { result } = renderHook(() => useDeadlineReminder(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.pendingReminders).toHaveLength(2))
  })

  it('filters out reminder ids that were dismissed today', async () => {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('reminder_dismissed', JSON.stringify({ date: today, ids: ['1'] }))
    vi.mocked(getDeadlineReminders).mockResolvedValue([sampleApp('1'), sampleApp('2')])
    const { result } = renderHook(() => useDeadlineReminder(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.pendingReminders).toHaveLength(1))
    expect(result.current.pendingReminders[0].id).toBe('2')
  })

  it('does not filter reminders dismissed on a different date', async () => {
    localStorage.setItem(
      'reminder_dismissed',
      JSON.stringify({ date: '2020-01-01', ids: ['1'] }),
    )
    vi.mocked(getDeadlineReminders).mockResolvedValue([sampleApp('1'), sampleApp('2')])
    const { result } = renderHook(() => useDeadlineReminder(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.pendingReminders).toHaveLength(2))
  })

  it('dismiss() writes today and all reminder ids to localStorage', async () => {
    vi.mocked(getDeadlineReminders).mockResolvedValue([sampleApp('1'), sampleApp('2')])
    const { result } = renderHook(() => useDeadlineReminder(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.pendingReminders).toHaveLength(2))

    result.current.dismiss()

    const today = new Date().toISOString().slice(0, 10)
    const stored = JSON.parse(localStorage.getItem('reminder_dismissed') ?? '{}') as {
      date: string
      ids: string[]
    }
    expect(stored.date).toBe(today)
    expect(stored.ids).toContain('1')
    expect(stored.ids).toContain('2')
  })
})
