import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, ListTodo, PlusCircle, Briefcase, Download, FileDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'
import SearchModal from '@/components/SearchModal'
import SettingsModal from '@/components/SettingsModal'
import { useModal } from '@/context/ModalContext'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { downloadExport } from '@/api/applications'

export default function Layout() {
  const { t } = useTranslation()
  const { isSearchOpen, openSearch, closeSearch } = useModal()
  const { user, logout } = useAuth()
  const [exportOpen, setExportOpen] = useState(false)
  const [exportError, setExportError] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/applications', label: t('nav.applications'), icon: ListTodo, end: false },
    { to: '/applications/new', label: t('nav.addNew'), icon: PlusCircle, end: true },
  ]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        isSearchOpen ? closeSearch() : openSearch()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isSearchOpen, openSearch, closeSearch])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    if (exportOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [exportOpen])

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Briefcase className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">{t('nav.brand')}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t space-y-3">
          {user && (
            <div className="flex items-center gap-2 px-1 min-w-0">
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="text-xs font-medium truncate">{user.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title={t('auth.logout')}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />

        <div ref={exportRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {exportOpen && (
            <div className="flex flex-col gap-1 bg-popover border rounded-lg shadow-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setExportError(false)
                  setExportOpen(false)
                  downloadExport('csv').catch(() => setExportError(true))
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {t('export.csv')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setExportError(false)
                  setExportOpen(false)
                  downloadExport('xlsx').catch(() => setExportError(true))
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {t('export.excel')}
              </Button>
            </div>
          )}
          {exportError && (
            <p className="text-xs text-destructive bg-background border rounded px-2 py-1 shadow-sm">
              {t('export.error')}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setExportOpen(o => !o); setExportError(false) }}
            className="shadow-md bg-background"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('export.button')}
          </Button>
        </div>
      </main>
      <SearchModal />
      <SettingsModal />
    </div>
  )
}
