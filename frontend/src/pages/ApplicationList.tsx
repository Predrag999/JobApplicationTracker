import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Trash2, ExternalLink, MessageSquare, Paperclip, AlertCircle, ClipboardList } from 'lucide-react'
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
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error, refetch } = useApplications({
    search: search || undefined,
    status: status === 'ALL' ? undefined : (status as ApplicationStatus),
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
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Button asChild>
          <Link to="/applications/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New
          </Link>
        </Button>
      </div>

      <div className="p-6 space-y-4">
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
            onValueChange={(v) => { setStatus(v as ApplicationStatus | 'ALL'); setPage(0) }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* States */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Could not load applications</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as Error)?.message ?? 'Unknown error'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : !data?.content.length ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">No applications found</p>
              {!search && status === 'ALL' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Start tracking your job search —{' '}
                  <Link to="/applications/new" className="text-primary hover:underline">
                    add your first application.
                  </Link>
                </p>
              )}
              {(search || status !== 'ALL') && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or filter.
                </p>
              )}
            </div>
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Files</th>
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
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {app.noteCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5" />
                          {app.attachmentCount}
                        </span>
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
    </div>
  )
}
