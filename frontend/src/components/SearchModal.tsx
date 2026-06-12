import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StatusBadge from '@/components/StatusBadge'
import { useApplications } from '@/hooks/useApplications'
import { useModal } from '@/context/ModalContext'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

const ALL_FILTERS = ['ALL' as const, ...APPLICATION_STATUSES]

export default function SearchModal() {
  const { isSearchOpen, closeSearch } = useModal()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const { data } = useApplications({
    search: query || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    size: 10,
  })

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('')
      setStatusFilter('ALL')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isSearchOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeSearch])

  if (!isSearchOpen) return null

  function handleSelect(id: string) {
    closeSearch()
    navigate(`/applications/${id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-lg bg-card border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base bg-transparent"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={closeSearch}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1.5 px-4 py-2.5 border-b flex-wrap">
          {ALL_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {s === 'ALL' ? t('search.all') : t(`status.${s}`)}
            </button>
          ))}
        </div>

        {/* Results */}
        <ul className="max-h-72 overflow-y-auto divide-y">
          {!data?.content.length ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {query ? t('search.noResults') : t('search.startTyping')}
            </li>
          ) : (
            data.content.map(app => (
              <li key={app.id}>
                <button
                  onClick={() => handleSelect(app.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{app.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.jobTitle}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex justify-between">
          <span>{t('search.footer')}</span>
          {data && (
            <span>{t('search.result', { count: data.totalElements })}</span>
          )}
        </div>
      </div>
    </div>
  )
}
