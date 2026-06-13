import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useApplication,
  useAutofill,
  useCreateApplication,
  useUpdateApplication,
} from '@/hooks/useApplications'
import { APPLICATION_STATUSES } from '@/types'

const schema = z.object({
  companyName: z.string().min(1, 'form.error.required'),
  jobTitle: z.string().min(1, 'form.error.required'),
  jobUrl: z.string().url('form.error.url').or(z.literal('')).optional(),
  status: z.enum(['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'TECHNICAL_TEST', 'OFFER', 'REJECTED', 'WITHDRAWN']),
  appliedDate: z.string().min(1, 'form.error.required'),
  deadlineDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function ApplicationForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const isEdit = !!id

  const { data: existing } = useApplication(id ?? '')
  const createApp = useCreateApplication()
  const updateApp = useUpdateApplication(id ?? '')
  const autofill = useAutofill()

  const [autofillUrl, setAutofillUrl] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'APPLIED',
      appliedDate: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (existing) {
      setValue('companyName', existing.companyName)
      setValue('jobTitle', existing.jobTitle)
      setValue('jobUrl', existing.jobUrl ?? '')
      setValue('status', existing.status)
      setValue('appliedDate', existing.appliedDate)
      setValue('deadlineDate', existing.deadlineDate ?? '')
    }
  }, [existing, setValue])

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      jobUrl: values.jobUrl || undefined,
      deadlineDate: values.deadlineDate || undefined,
    }
    if (isEdit) {
      await updateApp.mutateAsync(payload)
      navigate(`/applications/${id}`)
    } else {
      const created = await createApp.mutateAsync(payload)
      navigate(`/applications/${created.id}`)
    }
  }

  async function handleAutofill() {
    if (!autofillUrl.trim()) return
    try {
      const result = await autofill.mutateAsync(autofillUrl.trim())
      setValue('companyName', result.companyName)
      setValue('jobTitle', result.jobTitle)
      setValue('jobUrl', result.jobUrl)
    } catch {
      // autofill.isError becomes true — error message rendered below the button
    }
  }

  const statusValue = watch('status')

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? t('form.editTitle') : t('form.newTitle')}
      </h1>

      {!isEdit && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{t('form.autofill.title')}</p>
                <p className="text-sm text-muted-foreground">{t('form.autofill.subtitle')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={autofillUrl}
                onChange={(e) => setAutofillUrl(e.target.value)}
                placeholder={t('form.autofill.placeholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleAutofill()}
              />
              <Button
                type="button"
                onClick={handleAutofill}
                disabled={autofill.isPending || !autofillUrl.trim()}
                className="shrink-0"
              >
                {autofill.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : t('form.autofill.button')}
              </Button>
            </div>
            {autofill.isError && (
              <p className="text-xs text-destructive mt-2">{t('form.autofill.error')}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('form.company')} error={errors.companyName?.message}>
                <Input {...register('companyName')} placeholder={t('form.companyPlaceholder')} />
              </Field>
              <Field label={t('form.jobTitle')} error={errors.jobTitle?.message}>
                <Input {...register('jobTitle')} placeholder={t('form.rolePlaceholder')} />
              </Field>
            </div>

            <Field label={t('form.jobUrl')} error={errors.jobUrl?.message}>
              <Input {...register('jobUrl')} placeholder={t('form.urlPlaceholder')} type="url" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t('form.status')} error={errors.status?.message}>
                <Select
                  value={statusValue}
                  onValueChange={(v) => setValue('status', v as FormValues['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t('form.appliedDate')} error={errors.appliedDate?.message}>
                <Input {...register('appliedDate')} type="date" />
              </Field>
            </div>

            <Field label={t('form.deadline')} error={errors.deadlineDate?.message}>
              <Input {...register('deadlineDate')} type="date" />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? t('form.submit.save') : t('form.submit.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEdit ? `/applications/${id}` : '/applications')}
              >
                {t('form.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{t(error)}</p>}
    </div>
  )
}
