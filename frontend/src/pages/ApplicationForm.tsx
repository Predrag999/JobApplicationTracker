import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useApplication, useCreateApplication, useUpdateApplication } from '@/hooks/useApplications'
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/types'

const schema = z.object({
  companyName: z.string().min(1, 'Required'),
  jobTitle: z.string().min(1, 'Required'),
  jobUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  status: z.enum(['APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'TECHNICAL_TEST', 'OFFER', 'REJECTED', 'WITHDRAWN']),
  appliedDate: z.string().min(1, 'Required'),
  deadlineDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function ApplicationForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const { data: existing } = useApplication(id ?? '')
  const createApp = useCreateApplication()
  const updateApp = useUpdateApplication(id ?? '')

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

  const statusValue = watch('status')

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Edit Application' : 'New Application'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company *" error={errors.companyName?.message}>
                <Input {...register('companyName')} placeholder="Acme Corp" />
              </Field>
              <Field label="Job Title *" error={errors.jobTitle?.message}>
                <Input {...register('jobTitle')} placeholder="Software Engineer" />
              </Field>
            </div>

            <Field label="Job URL" error={errors.jobUrl?.message}>
              <Input {...register('jobUrl')} placeholder="https://..." type="url" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status *" error={errors.status?.message}>
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
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Applied Date *" error={errors.appliedDate?.message}>
                <Input {...register('appliedDate')} type="date" />
              </Field>
            </div>

            <Field label="Deadline / Interview Date" error={errors.deadlineDate?.message}>
              <Input {...register('deadlineDate')} type="date" />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? 'Save Changes' : 'Create Application'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEdit ? `/applications/${id}` : '/applications')}
              >
                Cancel
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
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
