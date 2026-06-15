import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeadlineReminder } from '@/hooks/useDeadlineReminder'

export default function ReminderModal() {
  const { t } = useTranslation()
  const { pendingReminders, dismiss } = useDeadlineReminder()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (pendingReminders.length > 0) setVisible(true)
  }, [pendingReminders.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleDismiss()
    }
    if (visible) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, dismiss])

  function handleDismiss() {
    dismiss()
    setVisible(false)
  }

  if (!visible || pendingReminders.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b">
          <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-base">{t('reminder.title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('reminder.body')}</p>
          </div>
        </div>

        <ul className="divide-y px-6 max-h-64 overflow-y-auto">
          {pendingReminders.map(app => (
            <li key={app.id} className="py-3">
              <p className="text-sm font-medium">{app.companyName}</p>
              <p className="text-xs text-muted-foreground">{app.jobTitle}</p>
            </li>
          ))}
        </ul>

        <div className="px-6 py-4 border-t flex justify-end">
          <Button onClick={handleDismiss}>{t('reminder.gotIt')}</Button>
        </div>
      </div>
    </div>
  )
}
