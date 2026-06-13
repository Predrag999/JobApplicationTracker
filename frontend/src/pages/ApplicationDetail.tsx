import { useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Trash2, ExternalLink, Paperclip, StickyNote, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusBadge from '@/components/StatusBadge'
import { useApplication, useDeleteApplication } from '@/hooks/useApplications'
import { useNotes, useCreateNote, useDeleteNote, useGenerateNote } from '@/hooks/useNotes'
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/useAttachments'
import { getDownloadUrl } from '@/api/attachments'
import { useForm } from 'react-hook-form'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: app, isLoading } = useApplication(id!)
  const { data: notes } = useNotes(id!)
  const { data: attachments } = useAttachments(id!)

  const deleteApp = useDeleteApplication()

  function handleDeleteApp() {
    if (confirm(t('detail.deleteConfirm'))) {
      deleteApp.mutate(id!, { onSuccess: () => navigate('/applications') })
    }
  }

  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">{t('detail.loading')}</div>
  }
  if (!app) {
    return <div className="p-6 text-muted-foreground text-sm">{t('detail.notFound')}</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{app.companyName}</h1>
              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="text-muted-foreground">{app.jobTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={app.status} />
          <Button variant="outline" size="sm" asChild>
            <Link to={`/applications/${id}/edit`}>
              <Pencil className="mr-1 h-3 w-3" />
              {t('detail.edit')}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteApp}
            disabled={deleteApp.isPending}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            {t('detail.delete')}
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
          <Detail label={t('detail.applied')} value={app.appliedDate} />
          <Detail label={t('detail.deadline')} value={app.deadlineDate ?? '—'} />
          <Detail label={t('detail.added')} value={new Date(app.createdAt).toLocaleDateString()} />
          <Detail label={t('detail.updated')} value={new Date(app.updatedAt).toLocaleDateString()} />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            {t('detail.notes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddNoteForm applicationId={id!} jobUrl={app.jobUrl} />
          {!notes?.length ? (
            <p className="text-sm text-muted-foreground">{t('detail.noNotes')}</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  noteId={note.id}
                  content={note.content}
                  createdAt={note.createdAt}
                  applicationId={id!}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            {t('detail.attachments')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadButton applicationId={id!} />
          {!attachments?.length ? (
            <p className="text-sm text-muted-foreground">{t('detail.noFiles')}</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <AttachmentItem
                  key={a.id}
                  id={a.id}
                  name={a.originalFileName}
                  size={a.fileSizeBytes}
                  applicationId={id!}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  )
}

function AddNoteForm({ applicationId, jobUrl }: { applicationId: string; jobUrl?: string }) {
  const { t } = useTranslation()
  const createNote = useCreateNote(applicationId)
  const generateNote = useGenerateNote(applicationId)
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<{ content: string }>()

  async function onSubmit(values: { content: string }) {
    if (!values.content.trim()) return
    await createNote.mutateAsync({ content: values.content.trim() })
    reset()
  }

  async function handleGenerate() {
    try {
      const result = await generateNote.mutateAsync()
      setValue('content', result.generatedContent)
    } catch {
      // generateNote.isError becomes true — error rendered below
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <Textarea
          {...register('content')}
          placeholder={t('detail.addNotePlaceholder')}
          className="min-h-[60px] resize-none"
        />
        <div className="flex flex-col justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={!jobUrl || generateNote.isPending}
            className="shrink-0 whitespace-nowrap"
          >
            {generateNote.isPending
              ? <><Loader2 className="w-3 h-3 animate-spin mr-1 inline" />{t('detail.generating')}</>
              : t('detail.generateWithAi')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="shrink-0">
            {t('detail.add')}
          </Button>
        </div>
      </form>
      {generateNote.isError && (
        <p className="text-xs text-destructive mt-1">{t('detail.generateError')}</p>
      )}
    </>
  )
}

function NoteItem({
  noteId,
  content,
  createdAt,
  applicationId,
}: {
  noteId: string
  content: string
  createdAt: string
  applicationId: string
}) {
  const deleteNote = useDeleteNote(applicationId)
  return (
    <li className="flex gap-3 group">
      <div className="flex-1 bg-muted/40 rounded-md px-3 py-2">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(createdAt).toLocaleString()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={() => deleteNote.mutate(noteId)}
        disabled={deleteNote.isPending}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </li>
  )
}

function UploadButton({ applicationId }: { applicationId: string }) {
  const { t } = useTranslation()
  const upload = useUploadAttachment(applicationId)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload.mutate(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        <Paperclip className="mr-2 h-3.5 w-3.5" />
        {upload.isPending ? t('detail.uploading') : t('detail.attachFile')}
      </Button>
    </>
  )
}

function AttachmentItem({
  id,
  name,
  size,
  applicationId,
}: {
  id: string
  name: string
  size: number
  applicationId: string
}) {
  const deleteAttachment = useDeleteAttachment(applicationId)

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <li className="flex items-center justify-between gap-2 group rounded-md border px-3 py-2 text-sm">
      <span className="truncate font-medium">{name}</span>
      <span className="text-muted-foreground shrink-0">{formatBytes(size)}</span>
      <div className="flex items-center gap-1 shrink-0">
        <a href={getDownloadUrl(id)} download={name}>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          onClick={() => deleteAttachment.mutate(id)}
          disabled={deleteAttachment.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  )
}
