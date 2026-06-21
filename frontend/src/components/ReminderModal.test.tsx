import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ApplicationResponse } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/hooks/useDeadlineReminder', () => ({
  useDeadlineReminder: vi.fn(),
}))

import ReminderModal from '@/components/ReminderModal'
import { useDeadlineReminder } from '@/hooks/useDeadlineReminder'

const sampleApp: ApplicationResponse = {
  id: '1',
  companyName: 'Acme Corp',
  jobTitle: 'Software Engineer',
  status: 'APPLIED',
  appliedDate: '2024-01-15',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  noteCount: 0,
  attachmentCount: 0,
}

describe('ReminderModal', () => {
  const mockDismiss = vi.fn()

  beforeEach(() => {
    mockDismiss.mockReset()
  })

  it('renders nothing when pendingReminders is empty', () => {
    vi.mocked(useDeadlineReminder).mockReturnValue({
      pendingReminders: [],
      dismiss: mockDismiss,
    })
    const { container } = render(<ReminderModal />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the modal when there are pending reminders', () => {
    vi.mocked(useDeadlineReminder).mockReturnValue({
      pendingReminders: [sampleApp],
      dismiss: mockDismiss,
    })
    render(<ReminderModal />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })

  it('renders the reminder title and body i18n keys', () => {
    vi.mocked(useDeadlineReminder).mockReturnValue({
      pendingReminders: [sampleApp],
      dismiss: mockDismiss,
    })
    render(<ReminderModal />)
    expect(screen.getByText('reminder.title')).toBeInTheDocument()
    expect(screen.getByText('reminder.body')).toBeInTheDocument()
  })

  it('clicking the dismiss button calls dismiss and hides the modal', async () => {
    const user = userEvent.setup()
    vi.mocked(useDeadlineReminder).mockReturnValue({
      pendingReminders: [sampleApp],
      dismiss: mockDismiss,
    })
    render(<ReminderModal />)
    await user.click(screen.getByRole('button', { name: 'reminder.gotIt' }))
    expect(mockDismiss).toHaveBeenCalledOnce()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })

  it('pressing Escape calls dismiss and hides the modal', () => {
    vi.mocked(useDeadlineReminder).mockReturnValue({
      pendingReminders: [sampleApp],
      dismiss: mockDismiss,
    })
    render(<ReminderModal />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockDismiss).toHaveBeenCalledOnce()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })

  it('lists all pending reminders', () => {
    const second: ApplicationResponse = { ...sampleApp, id: '2', companyName: 'Beta LLC', jobTitle: 'PM' }
    vi.mocked(useDeadlineReminder).mockReturnValue({
      pendingReminders: [sampleApp, second],
      dismiss: mockDismiss,
    })
    render(<ReminderModal />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta LLC')).toBeInTheDocument()
  })
})
