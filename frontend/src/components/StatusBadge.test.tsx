import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/StatusBadge'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('StatusBadge', () => {
  it('renders the i18n key for APPLIED', () => {
    render(<StatusBadge status="APPLIED" />)
    expect(screen.getByText('status.APPLIED')).toBeInTheDocument()
  })

  it('renders the i18n key for INTERVIEW', () => {
    render(<StatusBadge status="INTERVIEW" />)
    expect(screen.getByText('status.INTERVIEW')).toBeInTheDocument()
  })

  it('renders the i18n key for REJECTED', () => {
    render(<StatusBadge status="REJECTED" />)
    expect(screen.getByText('status.REJECTED')).toBeInTheDocument()
  })

  it('renders the i18n key for OFFER', () => {
    render(<StatusBadge status="OFFER" />)
    expect(screen.getByText('status.OFFER')).toBeInTheDocument()
  })

  it('renders the i18n key for WITHDRAWN', () => {
    render(<StatusBadge status="WITHDRAWN" />)
    expect(screen.getByText('status.WITHDRAWN')).toBeInTheDocument()
  })

  it('applies blue color classes for APPLIED status', () => {
    render(<StatusBadge status="APPLIED" />)
    expect(screen.getByText('status.APPLIED')).toHaveClass('bg-blue-100')
  })

  it('applies red color classes for REJECTED status', () => {
    render(<StatusBadge status="REJECTED" />)
    expect(screen.getByText('status.REJECTED')).toHaveClass('bg-red-100')
  })

  it('applies green color classes for OFFER status', () => {
    render(<StatusBadge status="OFFER" />)
    expect(screen.getByText('status.OFFER')).toHaveClass('bg-green-100')
  })

  it('forwards additional className to the badge element', () => {
    render(<StatusBadge status="APPLIED" className="my-custom-class" />)
    expect(screen.getByText('status.APPLIED')).toHaveClass('my-custom-class')
  })
})
