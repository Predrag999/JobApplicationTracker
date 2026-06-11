import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/StatusBadge'
import { useApplications, useDeleteApplication } from '@/hooks/useApplications'
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from '@/types'

export default function ApplicationList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ApplicationStatus | ''>('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useApplications({
    search: search || undefined,
    status: (status as ApplicationStatus) || undefined,
    page,
    size: 20,
  })

  const deleteApp = useDeleteApplication()

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (confirm('Delete this application?')) {
      deleteApp.mutate(id)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Button asChild>
          <Link to="/applications/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => { setStatus(v as ApplicationStatus | ''); setPage(0) }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : !data?.content.length ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No applications found.{' '}
          <Link to="/applications/new" className="text-primary hover:underline">
            Add one.
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Applied</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deadline</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.content.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1">
                        {app.companyName}
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{app.jobTitle}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{app.appliedDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.deadlineDate ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, app.id)}
                        disabled={deleteApp.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(data.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {data.totalElements} total · page {data.page + 1} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
