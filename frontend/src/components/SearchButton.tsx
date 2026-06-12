import { Search } from 'lucide-react'
import { useModal } from '@/context/ModalContext'

export default function SearchButton() {
  const { openSearch } = useModal()

  return (
    <button
      onClick={openSearch}
      className="flex items-center gap-2 h-9 pl-3 pr-2 rounded-full border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-56"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">Search jobs, companies...</span>
      <kbd className="flex items-center rounded border border-input bg-muted px-1.5 py-0.5 text-xs font-medium leading-none shrink-0">
        Ctrl K
      </kbd>
    </button>
  )
}
