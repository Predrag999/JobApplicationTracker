import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function renderWithRouter(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the brand title', () => {
    renderWithRouter('/')
    expect(screen.getByText('nav.brand')).toBeInTheDocument()
  })

  it('renders the Google sign-in link', () => {
    renderWithRouter('/')
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/google')
  })

  it('does not show error message when no error query param', () => {
    renderWithRouter('/')
    expect(screen.queryByText('login.error')).not.toBeInTheDocument()
  })

  it('shows auth error message when ?error=auth is in the URL', () => {
    renderWithRouter('/?error=auth')
    expect(screen.getByText('login.error')).toBeInTheDocument()
  })

  it('does not show error message for unrelated query params', () => {
    renderWithRouter('/?error=other')
    expect(screen.queryByText('login.error')).not.toBeInTheDocument()
  })

  it('renders login tagline and welcome text', () => {
    renderWithRouter('/')
    expect(screen.getByText('login.tagline')).toBeInTheDocument()
    expect(screen.getByText('login.welcome')).toBeInTheDocument()
  })
})
