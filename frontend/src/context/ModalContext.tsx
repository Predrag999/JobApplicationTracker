import { createContext, useContext, useState } from 'react'

interface ModalContextValue {
  isSearchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  isSettingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  return (
    <ModalContext.Provider
      value={{
        isSearchOpen,
        openSearch: () => setSearchOpen(true),
        closeSearch: () => setSearchOpen(false),
        isSettingsOpen,
        openSettings: () => setSettingsOpen(true),
        closeSettings: () => setSettingsOpen(false),
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used inside ModalProvider')
  return ctx
}
