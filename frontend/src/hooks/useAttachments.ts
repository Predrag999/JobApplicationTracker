import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listAttachments, uploadAttachment, deleteAttachment } from '@/api/attachments'

export function useAttachments(applicationId: string) {
  return useQuery({
    queryKey: ['attachments', applicationId],
    queryFn: () => listAttachments(applicationId),
    enabled: !!applicationId,
  })
}

export function useUploadAttachment(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(applicationId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['applications', applicationId] })
    },
  })
}

export function useDeleteAttachment(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['applications', applicationId] })
    },
  })
}
