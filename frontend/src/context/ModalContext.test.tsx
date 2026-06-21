import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModalProvider, useModal } from '@/context/ModalContext'

function ModalConsumer() {
  const { isSearchOpen, openSearch, closeSearch, isSettingsOpen, openSettings, closeSettings } =
    useModal()
  return (
    <div>
      <span data-testid="search">{isSearchOpen ? 'open' : 'closed'}</span>
      <span data-testid="settings">{isSettingsOpen ? 'open' : 'closed'}</span>
      <button onClick={openSearch}>open-search</button>
      <button onClick={closeSearch}>close-search</button>
      <button onClick={openSettings}>open-settings</button>
      <button onClick={closeSettings}>close-settings</button>
    </div>
  )
}

describe('ModalContext', () => {
  it('initial state has both modals closed', () => {
    render(
      <ModalProvider>
        <ModalConsumer />
      </ModalProvider>,
    )
    expect(screen.getByTestId('search')).toHaveTextContent('closed')
    expect(screen.getByTestId('settings')).toHaveTextContent('closed')
  })

  it('openSearch sets isSearchOpen to true', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalConsumer />
      </ModalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'open-search' }))
    expect(screen.getByTestId('search')).toHaveTextContent('open')
  })

  it('closeSearch sets isSearchOpen back to false', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalConsumer />
      </ModalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'open-search' }))
    await user.click(screen.getByRole('button', { name: 'close-search' }))
    expect(screen.getByTestId('search')).toHaveTextContent('closed')
  })

  it('openSettings sets isSettingsOpen to true', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalConsumer />
      </ModalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'open-settings' }))
    expect(screen.getByTestId('settings')).toHaveTextContent('open')
  })

  it('closeSettings sets isSettingsOpen back to false', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalConsumer />
      </ModalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'open-settings' }))
    await user.click(screen.getByRole('button', { name: 'close-settings' }))
    expect(screen.getByTestId('settings')).toHaveTextContent('closed')
  })

  it('search and settings modals are independent of each other', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalConsumer />
      </ModalProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'open-search' }))
    expect(screen.getByTestId('search')).toHaveTextContent('open')
    expect(screen.getByTestId('settings')).toHaveTextContent('closed')
  })

  it('useModal throws when used outside ModalProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ModalConsumer />)).toThrow('useModal must be used inside ModalProvider')
    spy.mockRestore()
  })
})
