import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        flex items-center gap-2 w-full rounded-md px-3 py-2
        text-sm font-medium transition-colors
        text-muted-foreground
        hover:bg-accent hover:text-accent-foreground
      "
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 shrink-0" />
          <span>Light mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" />
          <span>Dark mode</span>
        </>
      )}
    </button>
  )
}
