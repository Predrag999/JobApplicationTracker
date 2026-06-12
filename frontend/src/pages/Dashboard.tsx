import { Link } from 'react-router-dom'
import { PlusCircle, TrendingUp, CheckCircle2, XCircle, Briefcase, Settings } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStats } from '@/hooks/useStats'
import { useApplications } from '@/hooks/useApplications'
import StatusBadge from '@/components/StatusBadge'
import { STATUS_LABELS, type ApplicationStatus } from '@/types'
import { useModal } from '@/context/ModalContext'
import SearchButton from '@/components/SearchButton'

const PIE_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: '#3b82f6',
  PHONE_SCREEN: '#a855f7',
  INTERVIEW: '#eab308',
  TECHNICAL_TEST: '#f97316',
  OFFER: '#22c55e',
  REJECTED: '#ef4444',
  WITHDRAWN: '#9ca3af',
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: recent } = useApplications({ size: 5, sortBy: 'createdAt', sortDir: 'desc' })
  const { openSettings } = useModal()

  const pieData =
    stats
      ? Object.entries(stats.byStatus)
          .filter(([, count]) => count > 0)
          .map(([status, count]) => ({
            name: STATUS_LABELS[status as ApplicationStatus],
            value: count,
            color: PIE_COLORS[status as ApplicationStatus],
          }))
      : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <SearchButton />
          <Button variant="outline" size="icon" onClick={openSettings} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link to="/applications/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Application
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={statsLoading ? '—' : stats?.total ?? 0}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Active"
          value={statsLoading ? '—' : stats?.activeCount ?? 0}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          valueClass="text-blue-600"
        />
        <StatCard
          title="Offers"
          value={statsLoading ? '—' : stats?.offerCount ?? 0}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          valueClass="text-green-600"
        />
        <StatCard
          title="Rejected"
          value={statsLoading ? '—' : stats?.rejectedCount ?? 0}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          valueClass="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No applications yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/applications">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recent?.content.length ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No applications yet
              </div>
            ) : (
              <ul className="space-y-3">
                {recent.content.map((app) => (
                  <li key={app.id}>
                    <Link
                      to={`/applications/${app.id}`}
                      className="flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{app.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.jobTitle}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  valueClass,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  valueClass?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${valueClass ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
