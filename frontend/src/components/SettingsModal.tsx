import { useEffect } from 'react'
import { X, Sun, Moon, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModal } from '@/context/ModalContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

export default function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useModal()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSettings()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeSettings])

  if (!isSettingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
      onClick={closeSettings}
    >
      <div
        className="w-full max-w-sm bg-card border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Settings</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeSettings}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Theme */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Appearance
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                  theme === 'dark'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
