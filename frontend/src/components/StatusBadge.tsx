import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { type ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-blue-100 text-blue-800 border-blue-200',
  PHONE_SCREEN: 'bg-purple-100 text-purple-800 border-purple-200',
  INTERVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  TECHNICAL_TEST: 'bg-orange-100 text-orange-800 border-orange-200',
  OFFER: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_COLORS[status], 'font-medium', className)}
    >
      {t(`status.${status}`)}
    </Badge>
  )
}
