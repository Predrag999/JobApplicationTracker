import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/i18n', () => ({
  default: { changeLanguage: vi.fn() },
}))

import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import i18n from '@/i18n'

function LanguageConsumer() {
  const { language, setLanguage } = useLanguage()
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <button onClick={() => setLanguage('bg')}>set-bg</button>
      <button onClick={() => setLanguage('en')}>set-en</button>
    </div>
  )
}

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(i18n.changeLanguage).mockReset()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('defaults to en when localStorage is empty', () => {
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
  })

  it('reads stored language from localStorage on mount', () => {
    localStorage.setItem('language', 'bg')
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('bg')
  })

  it('setLanguage updates the displayed language', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'set-bg' }))
    expect(screen.getByTestId('lang')).toHaveTextContent('bg')
  })

  it('setLanguage calls i18n.changeLanguage with the new language', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'set-bg' }))
    expect(vi.mocked(i18n.changeLanguage)).toHaveBeenCalledWith('bg')
  })

  it('setLanguage persists the new language to localStorage', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'set-bg' }))
    expect(localStorage.getItem('language')).toBe('bg')
  })

  it('useLanguage throws when used outside LanguageProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<LanguageConsumer />)).toThrow(
      'useLanguage must be used inside LanguageProvider',
    )
    spy.mockRestore()
  })
})
